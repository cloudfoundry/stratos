import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { AfterContentInit, Component, OnDestroy, OnInit } from '@angular/core';
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
  SetOrg,
  SetServiceInstanceGuid,
  SetSpace,
} from '../../../../store/actions/create-service-instance.actions';
import { CreateServiceInstance, GetServiceInstances } from '../../../../store/actions/service-instances.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory, organizationSchemaKey, serviceInstancesSchemaKey } from '../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../store/helpers/entity-relations.types';
import { RequestInfoState } from '../../../../store/reducers/api-request-reducer/types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { selectOrgGuid, selectServicePlan } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { CloudFoundryEndpointService } from '../../../cloud-foundry/services/cloud-foundry-endpoint.service';
import { ServicesService } from '../../services.service';

@Component({
  selector: 'app-specify-details-step',
  templateUrl: './specify-details-step.component.html',
  styleUrls: ['./specify-details-step.component.scss'],
})
export class SpecifyDetailsStepComponent implements OnInit, OnDestroy, AfterContentInit {

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

  spaces$: Observable<APIResource<ISpace>[]>;
  orgs$: Observable<APIResource<IOrganization>[]>;

  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } =>
      !this.checkName(formField.value) ? { 'nameTaken': { value: formField.value } } : null;
  }

  constructor(
    private store: Store<AppState>,
    private servicesService: ServicesService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar,
  ) {

    this.stepperForm = new FormGroup({
      name: new FormControl('', [Validators.required, this.nameTakenValidator()]),
      org: new FormControl('', Validators.required),
      space: new FormControl('', Validators.required),
      params: new FormControl(''),
      tags: new FormControl(''),
    });

    const getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizations(servicesService.cfGuid);
    this.orgs$ = this.initOrgsObservable(getAllOrgsAction);

    const paginationKey = createEntityRelationPaginationKey(serviceInstancesSchemaKey, this.servicesService.serviceGuid);

    this.allServiceInstances$ = this.initServiceInstances(paginationKey);

    this.spaces$ = this.initSpacesObservable();
  }

  setOrg = (guid) => this.store.dispatch(new SetOrg(guid));

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
  }

  initOrgsObservable = (action) => getPaginationObservables<APIResource<IOrganization>>({
    store: this.store,
    action: action,
    paginationMonitor: this.paginationMonitorFactory.create(
      action.paginationKey,
      entityFactory(organizationSchemaKey)
    )
  }, true)
    .entities$.pipe(
    share(),
    first()
    )

  ngOnInit() {
  }

  ngAfterContentInit() {
    this.validate = this.stepperForm.statusChanges
      .map(() => {
        return this.stepperForm.valid;
      });

    this.orgSubscription = this.orgs$.pipe(
      tap(o => {
        const orgWithSpaces = o.filter(org => org.entity.spaces.length > 0);
        if (orgWithSpaces.length > 0) {
          const selectedOrgId = orgWithSpaces[0].metadata.guid;
          this.stepperForm.controls.org.setValue(selectedOrgId);
          this.store.dispatch(new SetOrg(selectedOrgId));
        }
      })
    ).subscribe();

    this.updateServiceInstanceNames();
  }

  initSpacesObservable = () => this.store.select(selectOrgGuid).pipe(
    filter(p => !!p),
    combineLatest(this.orgs$),
    map(([guid, orgs]) => {
      const filteredOrgs = orgs.filter(org => org.metadata.guid === guid);
      return filteredOrgs.length > 0 ? filteredOrgs[0] : null;
    }),
    filter(p => !!p),
    map(org => org.entity.spaces),
    tap(spaces => {
      if (spaces.length > 0) {
        const selectedSpaceId = spaces[0].metadata.guid;
        this.stepperForm.controls.space.setValue(selectedSpaceId);
        this.store.dispatch(new SetSpace(selectedSpaceId));
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
    return this.store.select(selectServicePlan).pipe(
      filter(p => !!p),
      switchMap(p => this.createServiceInstance(p)),
      filter(s => !s.creating),
      map(s => {
        if (s.error) {
          this.displaySnackBar();
          return { success: false };
        } else {

          const serviceInstanceGuid = s.response.result[0];
          this.store.dispatch(new SetServiceInstanceGuid(serviceInstanceGuid));
          return { success: true };
        }
      })
    );
  }

  createServiceInstance(servicePlanGuid: string): Observable<RequestInfoState> {

    const name = this.stepperForm.controls.name.value;
    const spaceGuid = this.stepperForm.controls.space.value;
    let params = this.stepperForm.controls.params.value;
    params = params === '' ? null : params;
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


  private displaySnackBar() {
    this.snackBar.open('Failed to create service instance! Please re-check the details.', 'Dismiss');
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
