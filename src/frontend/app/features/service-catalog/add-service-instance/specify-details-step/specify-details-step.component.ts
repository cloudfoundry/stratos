import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { AfterContentInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatChipInputEvent, MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { combineLatest, filter, first, map, switchMap, tap } from 'rxjs/operators';
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
import { CreateServiceInstance } from '../../../../store/actions/service-instances.actions';
import { AppState } from '../../../../store/app-state';
import { serviceBindingSchemaKey, serviceInstancesSchemaKey } from '../../../../store/helpers/entity-factory';
import { RequestInfoState } from '../../../../store/reducers/api-request-reducer/types';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import {
  selectCreateServiceInstance,
  selectCreateServiceInstanceOrgGuid,
} from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { CreateServiceInstanceState } from '../../../../store/types/create-service-instance.types';
import { getServiceJsonParams } from '../../services-helper';
import { CreateServiceInstanceHelperService } from '../create-service-instance-helper.service';

const enum FormMode {
  CreateServiceInstance = 'create-service-instance',
  BindServiceInstance = 'bind-service-instance',
}
@Component({
  selector: 'app-specify-details-step',
  templateUrl: './specify-details-step.component.html',
  styleUrls: ['./specify-details-step.component.scss'],
})
export class SpecifyDetailsStepComponent implements OnDestroy, OnInit, AfterContentInit {

  formModes = [
    {
      label: 'Create Service Instance',
      key: FormMode.CreateServiceInstance
    },
    {
      label: 'Bind Service Instance',
      key: FormMode.BindServiceInstance
    }
  ];
  @Input('showModeSelection')
  showModeSelection = false;

  formMode: FormMode = FormMode.CreateServiceInstance;

  selectExistingInstanceForm: FormGroup;
  createNewInstanceForm: FormGroup;
  serviceInstances$: Observable<APIResource<IServiceInstance>[]>;
  allServiceInstances$: Observable<APIResource<IServiceInstance>[]>;
  validate: BehaviorSubject<boolean> = new BehaviorSubject(false);
  allServiceInstanceNames: string[];
  tagsVisible = true;
  tagsSelectable = true;
  tagsRemovable = true;
  tagsAddOnBlur = true;
  separatorKeysCodes = [ENTER, COMMA, SPACE];
  tags = [];
  cfGuid: string;
  serviceGuid: string;
  spaces$: Observable<APIResource<ISpace>[]>;
  orgs$: Observable<APIResource<IOrganization>[]>;
  bindExistingInstance = false;

  subscriptions: Subscription[] = [];

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
    private cSIHelperService: CreateServiceInstanceHelperService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar,
  ) {

    this.setupForms();

    if (cSIHelperService.isMarketplace()) {
      this.InitOrgAndSpaceObs();
    }

    this.subscriptions.push(cSIHelperService.isInitialised().pipe(
      tap(o => {

        this.cSIHelperService.serviceGuid$.pipe(
          first(),
          tap(guid => {
            // This needs to be from a plan
            this.serviceInstances$ = cSIHelperService.getServiceInstancesForService();
            this.allServiceInstances$ = cSIHelperService.getServiceInstancesForService();
          }),
        ).subscribe();

        this.cSIHelperService.cfGuid$.pipe(first(), tap(guid => this.cfGuid = guid)).subscribe();
      })
    ).subscribe());
  }

  resetForms = (mode: FormMode) => {
    this.validate.next(false);
    this.createNewInstanceForm.reset();
    this.selectExistingInstanceForm.reset();
    if (mode === FormMode.CreateServiceInstance) {
      this.tags = [];
    } else if (mode === FormMode.BindServiceInstance) {
      this.bindExistingInstance = true;
    }
  }

  private InitOrgAndSpaceObs() {
    this.orgs$ = this.initOrgsObservable();
    this.spaces$ = this.initSpacesObservable();
  }

  private setupForms() {
    this.createNewInstanceForm = new FormGroup({
      name: new FormControl('', [Validators.required, this.nameTakenValidator()]),
      org: new FormControl('', Validators.required),
      space: new FormControl('', Validators.required),
      params: new FormControl('', SpecifyDetailsStepComponent.isValidJsonValidatorFn()),
      tags: new FormControl(''),
    });
    this.selectExistingInstanceForm = new FormGroup({
      serviceInstances: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit(): void {
    if (!this.cSIHelperService.isMarketplace()) {
      this.RemoveOrgAndSpaceFields();
    } else {
      this.subscriptions.push(this.cSIHelperService.getSelectedServicePlanAccessibility()
        .pipe(
          map(o => o.spaceScoped),
          tap(spaceScope => {
            if (spaceScope) {
              this.disableOrgAndSpaceFields();
            } else {
              this.enableOrgAndSpaceFields();
            }
          })).subscribe());
    }
  }

  setOrg = (guid) => this.store.dispatch(new SetCreateServiceInstanceOrg(guid));

  private enableOrgAndSpaceFields() {
    this.createNewInstanceForm.get('org').enable();
    this.createNewInstanceForm.get('space').enable();
  }

  private disableOrgAndSpaceFields() {
    this.createNewInstanceForm.get('org').disable();
    this.createNewInstanceForm.get('space').disable();
  }

  private RemoveOrgAndSpaceFields() {
    this.createNewInstanceForm = new FormGroup({
      name: new FormControl('', [Validators.required, this.nameTakenValidator()]),
      params: new FormControl('', SpecifyDetailsStepComponent.isValidJsonValidatorFn()),
      tags: new FormControl(''),
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  initOrgsObservable = (): Observable<APIResource<IOrganization>[]> => {
    return this.cSIHelperService.getOrgsForSelectedServicePlan();
  }


  ngAfterContentInit() {

    this.setupValidate();

    if (this.cSIHelperService.isMarketplace()) {
      this.subscriptions.push(this.orgs$.pipe(
        filter(p => !!p && p.length > 0),
        tap(o => {
          const orgWithSpaces = o.filter(org => org.entity.spaces.length > 0);
          if (orgWithSpaces.length > 0) {
            const selectedOrgId = orgWithSpaces[0].metadata.guid;
            this.createNewInstanceForm.controls.org.setValue(selectedOrgId);
            this.store.dispatch(new SetCreateServiceInstanceOrg(selectedOrgId));
          }
        })
      ).subscribe());
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
    combineLatest(this.cSIHelperService.getSelectedServicePlanAccessibility()),
    map(([spaces, servicePlanAccessibility]) => {
      if (servicePlanAccessibility.spaceScoped) {
        return spaces.filter(s => s.metadata.guid === servicePlanAccessibility.spaceGuid);
      }
      return spaces;
    }),
    tap((spaces) => {
      if (spaces.length > 0) {
        const selectedSpaceId = spaces[0].metadata.guid;
        this.createNewInstanceForm.controls.space.setValue(selectedSpaceId);
        this.store.dispatch(new SetCreateServiceInstanceSpace(selectedSpaceId));
      }
    })
  )

  updateServiceInstanceNames = () => {
    this.subscriptions.push(this.createNewInstanceForm.controls.space.statusChanges.pipe(
      combineLatest(this.serviceInstances$),
      map(([c, services]) => {
        return services.filter(s => s.entity.space_guid === this.createNewInstanceForm.controls.space.value);
      }),
      tap(o => {
        this.allServiceInstanceNames = o.map(s => s.entity.name);
      })
    ).subscribe());
  }

  onNext = () => {
    return this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p),
      switchMap(p => {
        if (this.bindExistingInstance) {
          // Binding an existing instance, therefore, skip creation by returning a dummy response
          return Observable.of({
            creating: false,
            error: false,
            response: {
              result: []
            }
          });
        } else {
          this.createServiceInstance(p);
        }
      }),
      filter(s => !s.creating),
      combineLatest(this.store.select(selectCreateServiceInstance)),
      first(),
      switchMap(([request, state]) => {
        if (request.error) {
          return this.handleException();
        } else {
          const serviceInstanceGuid = this.setServiceInstanceGuid(request);
          this.store.dispatch(new SetServiceInstanceGuid(serviceInstanceGuid));
          if (!!state.bindAppGuid) {
            return this.createBinding(serviceInstanceGuid, state.bindAppGuid, state.bindAppParams)
              .pipe(
                filter(s => {
                  return s && !s.creating;
                }),
                map(req => req.error ? this.handleException(true) : this.routeToServices(state.cfGuid, state.bindAppGuid))
              );
          } else {
            return Observable.of(this.routeToServices());
          }
        }
      }),
    );
  }

  routeToServices = (cfGuid: string = null, appGuid: string = null) => {
    if (this.cSIHelperService.isAppServices()) {
      this.store.dispatch(new RouterNav({ path: ['/applications', cfGuid, appGuid, 'services'] }));
    } else {
      this.store.dispatch(new RouterNav({ path: ['/services'] }));
    }
    return { success: true };
  }

  private setServiceInstanceGuid(request: { creating: boolean; error: boolean; response: { result: any[]; }; }) {
    let serviceInstanceGuid = '';
    if (this.bindExistingInstance) {
      serviceInstanceGuid = this.selectExistingInstanceForm.controls.serviceInstances.value;
    }
    else {
      serviceInstanceGuid = request.response.result[0];
    }
    return serviceInstanceGuid;
  }

  private handleException(bindingFailed: boolean = false) {
    this.displaySnackBar(bindingFailed);
    return Observable.of({ success: false });
  }

  private setupValidate() {
    this.subscriptions.push(this.createNewInstanceForm.statusChanges.pipe(
      map(() => this.validate.next(this.createNewInstanceForm.valid))).subscribe());
    this.subscriptions.push(this.selectExistingInstanceForm.statusChanges.pipe(
      map(() => this.validate.next(this.selectExistingInstanceForm.valid))).subscribe());
  }

  createServiceInstance(createServiceInstance: CreateServiceInstanceState): Observable<RequestInfoState> {

    const name = this.createNewInstanceForm.controls.name.value;
    let spaceGuid = '';
    let cfGuid = '';
    if (!this.cSIHelperService.isMarketplace()) {
      spaceGuid = createServiceInstance.spaceGuid;
      cfGuid = createServiceInstance.cfGuid;
    } else {
      spaceGuid = this.createNewInstanceForm.controls.space.value;
      cfGuid = this.cfGuid;
    }
    const servicePlanGuid = createServiceInstance.servicePlanGuid;
    const params = getServiceJsonParams(this.createNewInstanceForm.controls.params.value);
    let tagsStr = null;
    tagsStr = this.tags.length > 0 ? this.tags.map(t => t.label) : null;

    const newServiceInstanceGuid = name + spaceGuid + servicePlanGuid;

    this.store.dispatch(new CreateServiceInstance(
      this.cfGuid,
      newServiceInstanceGuid,
      name, servicePlanGuid, spaceGuid, params, tagsStr
    ));
    return this.store.select(selectRequestInfo(serviceInstancesSchemaKey, newServiceInstanceGuid));
  }

  createBinding = (serviceInstanceGuid: string, appGuid: string, params: {}) => {

    const guid = `${this.cfGuid}-${appGuid}-${serviceInstanceGuid}`;
    params = params;

    this.store.dispatch(new CreateServiceBinding(
      this.cfGuid,
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
    this.allServiceInstanceNames ?
      this.allServiceInstanceNames.indexOf(value || this.createNewInstanceForm.controls.name.value) === -1 : true

}
