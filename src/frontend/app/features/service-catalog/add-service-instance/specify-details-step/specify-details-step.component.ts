import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { AfterContentInit, Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatChipInputEvent, MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest, filter, first, map, share, switchMap, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IServiceInstance } from '../../../../core/cf-api-svc.types';
import { IOrganization, ISpace } from '../../../../core/cf-api.types';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import {
  SetCreateServiceInstance,
  SetCreateServiceInstanceOrg,
  SetCreateServiceInstanceSpace,
  SetServiceInstanceGuid,
} from '../../../../store/actions/create-service-instance.actions';
import { CreateServiceInstance, GetServiceInstances } from '../../../../store/actions/service-instances.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory, serviceInstancesSchemaKey } from '../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../store/helpers/entity-relations.types';
import { RequestInfoState } from '../../../../store/reducers/api-request-reducer/types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import {
  selectCreateServiceInstanceOrgGuid,
  selectCreateServiceInstanceServicePlan,
} from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { ServicesService } from '../../services.service';

@Component({
  selector: 'app-specify-details-step',
  templateUrl: './specify-details-step.component.html',
  styleUrls: ['./specify-details-step.component.scss'],
})
export class SpecifyDetailsStepComponent implements OnDestroy, AfterContentInit {

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
    private servicesService: ServicesService,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {

    this.stepperForm = new FormGroup({
      name: new FormControl('', [Validators.required, this.nameTakenValidator()]),
      org: new FormControl('', Validators.required),
      space: new FormControl('', Validators.required),
      params: new FormControl('', SpecifyDetailsStepComponent.isValidJsonValidatorFn()),
      tags: new FormControl(''),
    });

    this.orgs$ = this.initOrgsObservable();

    const paginationKey = createEntityRelationPaginationKey(serviceInstancesSchemaKey, this.servicesService.serviceGuid);

    this.allServiceInstances$ = this.initServiceInstances(paginationKey);

    this.spaces$ = this.initSpacesObservable();

    this.spaceScopeSub = this.servicesService.getSelectedServicePlanAccessibility()
      .pipe(
        map(o => o.spaceScoped),
        tap(spaceScope => {
          if (spaceScope) {
            this.stepperForm.get('org').disable();
            this.stepperForm.get('space').disable();
          } else {
            this.stepperForm.get('org').enable();
            this.stepperForm.get('space').enable();
          }
        })).subscribe();
  }

  setOrg = (guid) => this.store.dispatch(new SetCreateServiceInstanceOrg(guid));

  initServiceInstances = (paginationKey: string) => getPaginationObservables<APIResource<IServiceInstance>>({
    store: this.store,
    action: new GetServiceInstances(this.servicesService.cfGuid, paginationKey),
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
    this.orgSubscription.unsubscribe();
    this.serviceInstanceNameSub.unsubscribe();
    this.spaceScopeSub.unsubscribe();
  }

  initOrgsObservable = (): Observable<APIResource<IOrganization>[]> => {
    return this.servicesService.getOrgsForSelectedServicePlan();
  }


  ngAfterContentInit() {
    this.validate = this.stepperForm.statusChanges
      .map(() => {
        return this.stepperForm.valid;
      });

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

  initSpacesObservable = () => this.store.select(selectCreateServiceInstanceOrgGuid).pipe(
    filter(p => !!p),
    combineLatest(this.orgs$),
    map(([guid, orgs]) => {
      const filteredOrgs = orgs.filter(org => org.metadata.guid === guid);
      return filteredOrgs.length > 0 ? filteredOrgs[0] : null;
    }),
    filter(p => !!p),
    map(org => org.entity.spaces),
    combineLatest(this.servicesService.getSelectedServicePlanAccessibility()),
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
    return this.store.select(selectCreateServiceInstanceServicePlan).pipe(
      filter(p => !!p),
      switchMap(p => this.createServiceInstance(p)),
      filter(s => !s.creating),
      map(s => {
        if (s.error) {
          return { success: false, message: `Failed to create service instance: ${s.message}` };
        }
        const serviceInstanceGuid = s.response.result[0];
        this.store.dispatch(new SetServiceInstanceGuid(serviceInstanceGuid));
        return { success: true };
      })
    );
  }

  createServiceInstance(servicePlanGuid: string): Observable<RequestInfoState> {

    const name = this.stepperForm.controls.name.value;
    const spaceGuid = this.stepperForm.controls.space.value;
    let params = this.stepperForm.controls.params.value;
    try {
      params = JSON.parse(params) || null;
    } catch (e) {
      params = null;
    }
    let tagsStr = null;
    tagsStr = this.tags.length > 0 ? this.tags.map(t => t.label) : null;

    const newServiceInstanceGuid = name + spaceGuid + servicePlanGuid;

    this.store.dispatch(new CreateServiceInstance(
      this.servicesService.cfGuid,
      newServiceInstanceGuid,
      name,
      servicePlanGuid,
      spaceGuid,
      params,
      tagsStr
    ));
    this.store.dispatch(new SetCreateServiceInstance(name, spaceGuid, tagsStr, params));
    return this.store.select(selectRequestInfo(serviceInstancesSchemaKey, newServiceInstanceGuid));
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
