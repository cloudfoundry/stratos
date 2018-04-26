import { Component, OnDestroy, OnInit, AfterContentInit, AfterContentChecked } from '@angular/core';
import { FormControl, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { MatSnackBar, MatChipInputEvent } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest, filter, map, share, switchMap, tap, first, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import { ENTER, COMMA } from '@angular/cdk/keycodes';

import { IOrganization, ISpace } from '../../../../core/cf-api.types';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import {
  SetApp,
  SetCreateServiceInstance,
  SetOrg,
  SetSpace,
  SetServiceInstanceGuid,
} from '../../../../store/actions/create-service-instance.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { CreateServiceInstance } from '../../../../store/actions/service-instances.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory, organizationSchemaKey, serviceInstancesSchemaKey } from '../../../../store/helpers/entity-factory';
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
  validate: Observable<boolean>;
  orgSubscription: Subscription;
  spaceSubscription: Subscription;
  tagsVisible = true;
  tagsSelectable = true;
  tagsRemovable = true;
  tagsAddOnBlur = true;
  separatorKeysCodes = [ENTER, COMMA];
  tags = [];

  spaces$: Observable<APIResource<ISpace>[]>;
  orgs$: Observable<APIResource<IOrganization>[]>;

  stepperForm = new FormGroup({
    name: new FormControl('', Validators.required),
    org: new FormControl('', Validators.required),
    space: new FormControl('', Validators.required),
    params: new FormControl(''),
    tags: new FormControl(''),
  });
  constructor(
    private store: Store<AppState>,
    private servicesService: ServicesService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar,
  ) {

    const getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizations(servicesService.cfGuid);
    this.orgs$ = getPaginationObservables<APIResource<IOrganization>>({
      store: this.store,
      action: getAllOrgsAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        getAllOrgsAction.paginationKey,
        entityFactory(organizationSchemaKey)
      )
    }, true).entities$.pipe(
      share(),
      first()
      );

    this.spaces$ = this.store.select(selectOrgGuid).pipe(
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
    );
  }

  setOrg = (guid) => this.store.dispatch(new SetOrg(guid));

  ngOnDestroy(): void {
    this.orgSubscription.unsubscribe();
  }

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

  // nameTakenValidator = (): ValidatorFn => {
  //   return (formField: AbstractControl): { [key: string]: any } =>
  //     !this.checkName(formField.value) ? { 'nameTaken': { value: formField.value } } : null;
  // }

  // checkName = (value: string = null) => this.allServiceInstances ? this.allOrgs.indexOf(value || this.orgName.value) === -1 : true;


}
