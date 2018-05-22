import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { AfterContentInit, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatChipInputEvent, MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest, filter, first, map, share, switchMap, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IServiceInstance } from '../../../../core/cf-api-svc.types';
import { IOrganization, ISpace } from '../../../../core/cf-api.types';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import {
  SetCreateServiceInstanceOrg,
  SetCreateServiceInstanceSpace,
  SetServiceInstanceGuid,
} from '../../../../store/actions/create-service-instance.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { CreateServiceBinding } from '../../../../store/actions/service-bindings.actions';
import { CreateServiceInstance, GetServiceInstances } from '../../../../store/actions/service-instances.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory, serviceBindingSchemaKey, serviceInstancesSchemaKey } from '../../../../store/helpers/entity-factory';
import { RequestInfoState } from '../../../../store/reducers/api-request-reducer/types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import {
  selectCreateServiceInstance,
  selectCreateServiceInstanceCfGuid,
  selectCreateServiceInstanceOrgGuid,
  selectCreateServiceInstanceServiceGuid,
} from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { CreateServiceInstanceState } from '../../../../store/types/create-service-instance.types';
import { getServiceJsonParams, isMarketplaceMode, safeUnsubscribe } from '../../services-helper';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelperService } from '../create-service-instance-helper.service';

@Component({
  selector: 'app-specify-details-step',
  templateUrl: './specify-details-step.component.html',
  styleUrls: ['./specify-details-step.component.scss'],
})
export class SpecifyDetailsStepComponent implements OnDestroy, OnInit, AfterContentInit {
  marketPlaceMode: boolean;
  cSIHelperService$: Observable<CreateServiceInstanceHelperService>;
  constructorSubscription: Subscription;
  stepperForm: FormGroup;
  serviceInstanceNameSub: Subscription;
  allServiceInstances$: Observable<APIResource<IServiceInstance>[]>;
  validate: Observable<boolean>;
  orgSubscription: Subscription;
  spaceSubscription: Subscription;
  allServiceInstanceNames: string[];
  tagsVisible = true;
  tagsSelectable = true;
  tagsRemovable = true;
  tagsAddOnBlur = true;
  separatorKeysCodes = [ENTER, COMMA, SPACE];
  tags = [];
  spaceScopeSub: Subscription;
  spaces$: Observable<APIResource<ISpace>[]>;
  orgs$: Observable<APIResource<IOrganization>[]>;

  static isValidJsonValidatorFn = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } => {

      try {
        if (formField.value) {
          const jsonObj = JSON.parse(formField.value);
          // Check if jsonObj is actually an obj
          if (jsonObj.constructor !== {}.constructor) {
            throw new Error('not an object');
          }
        }
      } catch (e) {
        return { 'notValidJson': { value: formField.value } };
      }
      return null;
    };
  }
  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } =>
      !this.checkName(formField.value) ? { 'nameTaken': { value: formField.value } } : null;
  }

  constructor(
    private store: Store<AppState>,
    private cSIHelperServiceFactory: CreateServiceInstanceHelperServiceFactory,
    private activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar,
  ) {

    this.stepperForm = new FormGroup({
      name: new FormControl('', [Validators.required, this.nameTakenValidator()]),
      org: new FormControl('', Validators.required),
      space: new FormControl('', Validators.required),
      params: new FormControl('', SpecifyDetailsStepComponent.isValidJsonValidatorFn()),
      tags: new FormControl(''),
    });

    this.cSIHelperService$ = Observable.combineLatest(
      this.store.select(selectCreateServiceInstanceCfGuid),
      this.store.select(selectCreateServiceInstanceServiceGuid)).pipe(
        filter(([c, s]) => !!s && !!c),
        map(([cfGuid, serviceGuid]) => cSIHelperServiceFactory.create(cfGuid, serviceGuid))
      );

    this.marketPlaceMode = isMarketplaceMode(activatedRoute);
    if (this.marketPlaceMode) {
      this.orgs$ = this.cSIHelperService$.pipe(switchMap(s => s.getOrgsForSelectedServicePlan()));
      this.spaces$ = this.cSIHelperService$.pipe(switchMap(s => this.initSpacesObservable()));

    }
    this.allServiceInstances$ = this.cSIHelperService$.pipe(switchMap(s => this.initServiceInstances(s.cfGuid, s.serviceGuid)));

  }

  ngOnInit(): void {
    if (!this.marketPlaceMode) {
      this.stepperForm = new FormGroup({
        name: new FormControl('', [Validators.required, this.nameTakenValidator()]),
        params: new FormControl('', SpecifyDetailsStepComponent.isValidJsonValidatorFn()),
        tags: new FormControl(''),
      });
    } else {
      this.spaceScopeSub = this.cSIHelperService$.pipe(switchMap(s => s.getSelectedServicePlanAccessibility().pipe(
        map(o => o.spaceScoped),
        tap(spaceScope => {
          if (spaceScope) {
            this.stepperForm.get('org').disable();
            this.stepperForm.get('space').disable();
          } else {
            this.stepperForm.get('org').enable();
            this.stepperForm.get('space').enable();
          }
        })))).subscribe();
    }
  }

  setOrg = (guid) => this.store.dispatch(new SetCreateServiceInstanceOrg(guid));

  initServiceInstances = (cfGuid: string, paginationKey: string) => getPaginationObservables<APIResource<IServiceInstance>>({
    store: this.store,
    action: new GetServiceInstances(cfGuid, paginationKey),
    paginationMonitor: this.paginationMonitorFactory.create(
      paginationKey,
      entityFactory(serviceInstancesSchemaKey)
    )
  }, true)
    .entities$.pipe(
      share(),
      first()
    )
  ngOnDestroy(): void {
    safeUnsubscribe(this.orgSubscription);
    safeUnsubscribe(this.serviceInstanceNameSub);
    safeUnsubscribe(this.spaceScopeSub);
    safeUnsubscribe(this.constructorSubscription);
  }

  ngAfterContentInit() {
    this.validate = this.stepperForm.statusChanges
      .map(() => {
        return this.stepperForm.valid;
      });

    if (this.marketPlaceMode) {
      this.orgSubscription = this.orgs$.pipe(
        filter(p => !!p && p.length > 0),
        tap(o => {
          const orgWithSpaces = o.filter(org => org.entity.spaces.length > 0);
          if (orgWithSpaces.length > 0) {
            const selectedOrgId = orgWithSpaces[0].metadata.guid;
            this.stepperForm.controls.org.setValue(selectedOrgId);
            this.store.dispatch(new SetCreateServiceInstanceOrg(selectedOrgId));
          }
        })
      ).subscribe();
      this.updateServiceInstanceNames();
    }
  }

  initSpacesObservable = () => this.store.select(selectCreateServiceInstanceOrgGuid).pipe(
    filter(p => !!p),
    combineLatest(this.orgs$),
    map(([guid, orgs]) => {
      const filteredOrgs = orgs.filter(org => org.metadata.guid === guid);
      return filteredOrgs.length > 0 ? filteredOrgs[0] : null;
    }),
    filter(p => !!p),
    map(org => org.entity.spaces),
    combineLatest(this.cSIHelperService$.pipe(switchMap(s => s.getSelectedServicePlanAccessibility()))),
    map(([spaces, servicePlanAccessibility]) => {
      if (servicePlanAccessibility.spaceScoped) {
        return spaces.filter(s => s.metadata.guid === servicePlanAccessibility.spaceGuid);
      }
      return spaces;
    }),
    tap((spaces) => {
      if (spaces.length > 0) {
        const selectedSpaceId = spaces[0].metadata.guid;
        this.stepperForm.controls.space.setValue(selectedSpaceId);
        this.store.dispatch(new SetCreateServiceInstanceSpace(selectedSpaceId));
      }
    })
  )

  updateServiceInstanceNames = () => {
    this.serviceInstanceNameSub = this.stepperForm.controls.space.statusChanges.pipe(
      combineLatest(this.allServiceInstances$),
      map(([c, services]) => {
        return services.filter(s => s.entity.space_guid === this.stepperForm.controls.space.value);
      }),
      tap(o => {
        this.allServiceInstanceNames = o.map(s => s.entity.name);
      })
    ).subscribe();
  }

  onNext = () => {
    return this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p),
      switchMap(p => this.createServiceInstance(p)),
      filter(s => !s.creating),
      combineLatest(this.store.select(selectCreateServiceInstance)),
      first(),
      switchMap(([request, state]) => {
        if (request.error) {
          this.displaySnackBar();
          return Observable.of({ success: false });
        } else {
          const serviceInstanceGuid = request.response.result[0];
          this.store.dispatch(new SetServiceInstanceGuid(serviceInstanceGuid));
          if (!!state.bindAppGuid) {
            return this.createBinding(serviceInstanceGuid, state.cfGuid, state.bindAppGuid, state.bindAppParams).pipe(
              filter(s => {
                return s && !s.creating;
              }),
              map(req => {
                if (req.error) {
                  this.displaySnackBar(true);
                  return { success: false };
                } else {
                  return this.routeToServices();
                }
              }));
          } else {
            return Observable.of(this.routeToServices());
          }
        }
      }),
    );
  }

  routeToServices = () => {
    this.store.dispatch(new RouterNav({ path: ['/services'] }));
    return { success: true };
  }
  createServiceInstance(createServiceInstance: CreateServiceInstanceState): Observable<RequestInfoState> {

    const name = this.stepperForm.controls.name.value;
    let spaceGuid = '';
    let cfGuid = '';
    if (!this.marketPlaceMode) {
      spaceGuid = createServiceInstance.spaceGuid;
    } else {
      spaceGuid = this.stepperForm.controls.space.value;
    }
    cfGuid = createServiceInstance.cfGuid;
    const servicePlanGuid = createServiceInstance.servicePlanGuid;
    const params = getServiceJsonParams(this.stepperForm.controls.params.value);
    let tagsStr = null;
    tagsStr = this.tags.length > 0 ? this.tags.map(t => t.label) : null;

    const newServiceInstanceGuid = name + spaceGuid + servicePlanGuid;

    this.store.dispatch(new CreateServiceInstance(
      cfGuid,
      newServiceInstanceGuid,
      name, servicePlanGuid, spaceGuid, params, tagsStr
    ));
    return this.store.select(selectRequestInfo(serviceInstancesSchemaKey, newServiceInstanceGuid));
  }

  createBinding = (serviceInstanceGuid: string, cfGuid: string, appGuid: string, params: {}) => {

    const guid = `${cfGuid}-${appGuid}-${serviceInstanceGuid}`;
    params = params;

    this.store.dispatch(new CreateServiceBinding(
      cfGuid,
      guid,
      appGuid,
      serviceInstanceGuid,
      params
    ));

    return this.store.select(selectRequestInfo(serviceBindingSchemaKey, guid));
  }


  private displaySnackBar(isBindingFailure = false) {

    if (isBindingFailure) {
      this.snackBar.open('Failed to bind app! Please re-check the details.', 'Dismiss');
    } else {
      this.snackBar.open('Failed to create service instance! Please re-check the details.', 'Dismiss');
    }
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    if ((value || '').trim()) {
      this.tags.push({ label: value.trim() });
    }

    if (input) {
      input.value = '';
    }
  }

  removeTag(tag: any): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }


  checkName = (value: string = null) =>
    this.allServiceInstanceNames ? this.allServiceInstanceNames.indexOf(value || this.stepperForm.controls.name.value) === -1 : true

}
