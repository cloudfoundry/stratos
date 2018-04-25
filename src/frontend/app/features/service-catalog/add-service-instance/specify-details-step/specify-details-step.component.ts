import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest, filter, map, share, tap, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IOrganization, ISpace, IApp } from '../../../../core/cf-api.types';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { SetCreateServiceInstance, SetOrg, SetSpace, SetApp } from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory, organizationSchemaKey, applicationSchemaKey, spaceSchemaKey, serviceInstancesSchemaKey } from '../../../../store/helpers/entity-factory';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectOrgGuid, selectSpaceGuid, selectServicePlan } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { CloudFoundryEndpointService } from '../../../cloud-foundry/services/cloud-foundry-endpoint.service';
import { ServicesService } from '../../services.service';
import { GetAllAppsInSpace } from '../../../../store/actions/space.actions';
import { createEntityRelationPaginationKey } from '../../../../store/helpers/entity-relations.types';
import { CreateServiceInstance } from '../../../../store/actions/service-instances.actions';
import { RequestInfoState } from '../../../../store/reducers/api-request-reducer/types';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { RouterNav } from '../../../../store/actions/router.actions';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-specify-details-step',
  templateUrl: './specify-details-step.component.html',
  styleUrls: ['./specify-details-step.component.scss'],
})
export class SpecifyDetailsStepComponent implements OnInit, OnDestroy {
  spaceSubscription: Subscription;

  spaces$: Observable<APIResource<ISpace>[]>;
  orgs$: Observable<APIResource<IOrganization>[]>;
  selectedOrgId: string;
  selectedSpaceId: string;
  allAppsSubscription: Subscription;
  apps$: Observable<APIResource<IApp>[]>;
  stepperForm: FormGroup;
  constructor(
    private store: Store<AppState>,
    private servicesService: ServicesService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar,
  ) {
    this.stepperForm = new FormGroup({
      name: new FormControl('', Validators.required),
      org: new FormControl('', Validators.required),
      space: new FormControl('', Validators.required),
      params: new FormControl(''),
      tags: new FormControl(''),
      apps: new FormControl(''),
    });

    const getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizations(servicesService.cfGuid);
    this.orgs$ = getPaginationObservables<APIResource<IOrganization>>({
      store: this.store,
      action: getAllOrgsAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        getAllOrgsAction.paginationKey,
        entityFactory(organizationSchemaKey)
      )
    }, true).entities$;

    this.orgs$.pipe(
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
        console.log(o[0]);
        this.selectedSpaceId = o[0].metadata.guid;
        this.store.dispatch(new SetSpace(this.selectedSpaceId));
      })
    ).subscribe();

    this.allAppsSubscription = this.store.select(selectSpaceGuid).pipe(
      tap(spaceGuid => {
        const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid);
        this.apps$ = getPaginationObservables<APIResource<IApp>>({
          store: this.store,
          action: new GetAllAppsInSpace(this.servicesService.cfGuid, spaceGuid, paginationKey),
          paginationMonitor: this.paginationMonitorFactory.create(
            paginationKey,
            entityFactory(applicationSchemaKey)
          )
        }, true).entities$;

      })
    ).subscribe();
  }

  setOrg = (guid) => this.store.dispatch(new SetOrg(guid));
  setApp = (guid) => this.store.dispatch(new SetApp(guid));


  ngOnInit() {
  }

  validate = () => true;

  onNext = () => {
    return this.store.select(selectServicePlan).pipe(
      filter(p => !!p),
      switchMap(p => this.createServiceInstance(p)),
      filter(s => !s.creating),
      map(s => {
        if (s.error) {
          this.displaySnackBar();
          return Observable.of({ success: false });
        }
        this.store.dispatch(
          new RouterNav({ path: ['service-catalog', this.servicesService.cfGuid, this.servicesService.serviceGuid, 'instances'] })
        );
        return Observable.of({ success: true });
      })
    );
  }

  ngOnDestroy(): void {
    this.allAppsSubscription.unsubscribe();
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
    return this.store.select(selectRequestInfo(serviceInstancesSchemaKey, newServiceInstanceGuid));
  }


  private displaySnackBar() {
    this.snackBar.open('Failed to create service instance! Please re-check the details.', 'Dismiss');
  }
}
