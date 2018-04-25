import { Component, OnDestroy, OnInit, AfterContentInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest, filter, map, share, switchMap, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

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

  spaces$: Observable<APIResource<ISpace>[]>;
  orgs$: Observable<APIResource<IOrganization>[]>;
  selectedOrgId: string;
  selectedSpaceId: string;

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
    }, true).entities$;

    this.orgSubscription = this.orgs$.pipe(
      tap(o => {
        this.selectedOrgId = o[0].metadata.guid;
        this.store.dispatch(new SetOrg(this.selectedOrgId));
      })
    ).subscribe();

    this.spaces$ = this.store.select(selectOrgGuid).pipe(
      filter(p => !!p),
      combineLatest(this.orgs$),
      map(([guid, orgs]) => orgs.filter(org => org.metadata.guid === guid)[0]),
      map(org => org.entity.spaces),
      share()
    );

    this.spaceSubscription = this.spaces$.pipe(
      tap(o => {
        this.selectedSpaceId = o[0].metadata.guid;
        this.store.dispatch(new SetSpace(this.selectedSpaceId));
      })
    ).subscribe();

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
        console.log(this.stepperForm.valid);
        return this.stepperForm.valid;
      });
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
    let allTags = this.stepperForm.controls.tags.value;
    allTags = allTags === '' ? null : allTags.split(',');
    const tags = allTags;

    const newServiceInstanceGuid = name + spaceGuid + servicePlanGuid;

    this.store.dispatch(new CreateServiceInstance(
      this.servicesService.cfGuid,
      newServiceInstanceGuid,
      name,
      servicePlanGuid,
      spaceGuid,
      params,
      tags
    ));
    this.store.dispatch(new SetCreateServiceInstance(name, spaceGuid, tags, params));
    return this.store.select(selectRequestInfo(serviceInstancesSchemaKey, newServiceInstanceGuid));
  }


  private displaySnackBar() {
    this.snackBar.open('Failed to create service instance! Please re-check the details.', 'Dismiss');
  }
}
