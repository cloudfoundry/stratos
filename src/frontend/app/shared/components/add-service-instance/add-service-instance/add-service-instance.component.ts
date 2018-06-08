import { TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, AfterContentInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { map, tap, take, filter, switchMap, first } from 'rxjs/operators';

import { IServiceInstance } from '../../../../core/cf-api-svc.types';
import { IApp, ISpace } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { getIdFromRoute } from '../../../../features/cloud-foundry/cf.helpers';
import { CsiModeService } from '../csi-mode.service';
import { servicesServiceFactoryProvider } from '../../../../features/service-catalog/service-catalog.helpers';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { GetApplication } from '../../../../store/actions/application.actions';
import {
  SetCreateServiceInstance,
  SetServiceInstanceGuid,
  SetCreateServiceInstanceCFDetails,
  SetCreateServiceInstanceServiceGuid,
  ResetCreateServiceInstanceState,
} from '../../../../store/actions/create-service-instance.actions';
import { GetServiceInstance } from '../../../../store/actions/service-instances.actions';
import { GetAllAppsInSpace, GetSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import { applicationSchemaKey, entityFactory, spaceSchemaKey, serviceInstancesSchemaKey } from '../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../store/helpers/entity-relations.types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelperService } from '../create-service-instance-helper.service';
import { CsiGuidsService } from '../csi-guids.service';

@Component({
  selector: 'app-add-service-instance',
  templateUrl: './add-service-instance.component.html',
  styleUrls: ['./add-service-instance.component.scss'],
  providers: [
    servicesServiceFactoryProvider,
    CreateServiceInstanceHelperServiceFactory,
    TitleCasePipe,
    CsiGuidsService,
    CsiModeService
  ]
})
export class AddServiceInstanceComponent implements OnDestroy, AfterContentInit {


  initialisedService$: Observable<boolean>;
  skipApps$: Observable<boolean>;
  cancelUrl: string;
  marketPlaceMode: boolean;
  cSIHelperService: CreateServiceInstanceHelperService;
  displaySelectServiceStep: boolean;
  displaySelectCfStep: boolean;
  title$: Observable<string>;
  serviceInstancesUrl: string;
  servicesWallCreateInstance = false;
  stepperText = 'Select a Cloud Foundry instance, organization and space for the service instance.';
  bindAppStepperText = 'Bind App (Optional)';
  appId: string;
  constructor(
    private cSIHelperServiceFactory: CreateServiceInstanceHelperServiceFactory,
    private activatedRoute: ActivatedRoute,
    private store: Store<AppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    private csiGuidsService: CsiGuidsService,
    private entityServiceFactory: EntityServiceFactory,
    private modeService: CsiModeService,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {

  }
  ngAfterContentInit(): void {

    // Check if wizard has been initiated from the Services Marketplace
    if (this.modeService.isMarketplaceMode()) {
      this.initialisedService$ = this.initialiseForMarketplaceMode();
    }

    // Check if wizard has been initiated to edit a service instance
    if (this.modeService.isEditServiceInstanceMode()) {
      this.initialisedService$ = this.configureForEditServiceInstanceMode();
    } else if (this.modeService.isAppServicesMode()) {
      // Setup wizard for App services mode
      this.initialisedService$ = this.setupForAppServiceMode();
    } else if (this.modeService.isServicesWallMode()) {
      // Setup wizard for default mode
      this.servicesWallCreateInstance = true;
      this.serviceInstancesUrl = `/services`;
      this.title$ = observableOf(`Create Service Instance`);
    }

    this.skipApps$ = this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p && !!p.spaceGuid && !!p.cfGuid),
      switchMap(createServiceInstance => {
        const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, createServiceInstance.spaceGuid);
        return getPaginationObservables<APIResource<IApp>>({
          store: this.store,
          action: new GetAllAppsInSpace(createServiceInstance.cfGuid, createServiceInstance.spaceGuid, paginationKey),
          paginationMonitor: this.paginationMonitorFactory.create(
            paginationKey,
            entityFactory(applicationSchemaKey)
          )
        }, true).entities$;
      }),
      map(apps => apps.length === 0)
    );
  }

  onNext = () => {
    this.store.dispatch(new SetCreateServiceInstanceCFDetails(
      this.cfOrgSpaceService.cf.select.getValue(),
      this.cfOrgSpaceService.org.select.getValue(),
      this.cfOrgSpaceService.space.select.getValue()
    ));
    return observableOf({ success: true });
  }

  private getIdsFromRoute() {
    const serviceId = getIdFromRoute(this.activatedRoute, 'serviceId');
    const cfId = getIdFromRoute(this.activatedRoute, 'cfId');
    const appId = getIdFromRoute(this.activatedRoute, 'id');
    return { serviceId, cfId, appId };
  }

  private setupForAppServiceMode() {

    const appId = getIdFromRoute(this.activatedRoute, 'id');
    const cfId = getIdFromRoute(this.activatedRoute, 'cfId');
    this.appId = appId;
    this.serviceInstancesUrl = `/applications/${cfId}/${appId}/services`;
    this.bindAppStepperText = 'Binding Params (Optional)';
    const entityService = this.entityServiceFactory.create<APIResource<IApp>>(
      applicationSchemaKey,
      entityFactory(applicationSchemaKey),
      appId,
      new GetApplication(appId, cfId, [createEntityRelationKey(applicationSchemaKey, spaceSchemaKey)]),
      true);
    return entityService.waitForEntity$.pipe(
      filter(p => !!p),
      tap(app => {
        const spaceEntity = app.entity.entity.space as APIResource<ISpace>;
        this.store.dispatch(
          new SetCreateServiceInstanceCFDetails(cfId, spaceEntity.entity.organization_guid, app.entity.entity.space_guid)
        );
        this.title$ = observableOf(`Create and/or Bind Service Instance to '${app.entity.entity.name}'`);
      }),
      take(1),
      map(o => false)
    );
  }

  private configureForEditServiceInstanceMode() {
    const { cfId, serviceInstanceId } = this.activatedRoute.snapshot.params;
    const entityService = this.getServiceInstanceEntityService(serviceInstanceId, cfId);
    this.serviceInstancesUrl = `/services`;
    return entityService.waitForEntity$.pipe(
      filter(p => !!p),
      tap(serviceInstance => {
        const serviceInstanceEntity = serviceInstance.entity.entity;
        this.csiGuidsService.cfGuid = cfId;
        this.title$ = observableOf(`Edit Service Instance: ${serviceInstanceEntity.name}`);
        const serviceGuid = serviceInstance.entity.entity.service_guid;
        this.csiGuidsService.serviceGuid = serviceGuid;
        this.cSIHelperService = this.cSIHelperServiceFactory.create(cfId, serviceGuid);
        this.store.dispatch(new SetCreateServiceInstanceServiceGuid(serviceGuid));
        this.store.dispatch(new SetServiceInstanceGuid(serviceInstance.entity.metadata.guid));
        this.store.dispatch(new SetCreateServiceInstance(
          serviceInstanceEntity.name,
          serviceInstanceEntity.space_guid,
          serviceInstanceEntity.tags,
          ''
        ));
        const spaceEntityService = this.getSpaceEntityService(serviceInstanceEntity.space_guid, cfId);
        spaceEntityService.waitForEntity$.pipe(
          filter(p => !!p),
          tap(spaceEntity => {
            this.store.dispatch(new SetCreateServiceInstanceCFDetails(
              cfId,
              spaceEntity.entity.entity.organization_guid,
              spaceEntity.entity.metadata.guid)
            );
          }),
          take(1)
        ).subscribe();
      }),
      take(1),
      map(o => false),
    );
  }

  private getServiceInstanceEntityService(serviceInstanceId: string, cfId: string) {
    return this.entityServiceFactory.create<APIResource<IServiceInstance>>(
      serviceInstancesSchemaKey,
      entityFactory(serviceInstancesSchemaKey),
      serviceInstanceId,
      new GetServiceInstance(serviceInstanceId,
        cfId),
      true);
  }

  private getSpaceEntityService(spaceGuid: string, cfGuid: string) {
    return this.entityServiceFactory.create<APIResource<ISpace>>(
      spaceSchemaKey,
      entityFactory(spaceSchemaKey),
      spaceGuid,
      new GetSpace(spaceGuid, cfGuid),
      true);
  }

  ngOnDestroy(): void {
    this.store.dispatch(new ResetCreateServiceInstanceState());
  }

  private initialiseForMarketplaceMode(): Observable<boolean> {
    const { cfId, serviceId } = this.activatedRoute.snapshot.params;
    this.csiGuidsService.cfGuid = cfId;
    this.csiGuidsService.serviceGuid = serviceId;
    this.cSIHelperService = this.cSIHelperServiceFactory.create(cfId, serviceId);
    this.store.dispatch(new SetCreateServiceInstanceCFDetails(cfId));
    this.store.dispatch(new SetCreateServiceInstanceServiceGuid(serviceId));
    this.serviceInstancesUrl = `/marketplace/${cfId}/${serviceId}/instances`;
    this.title$ = this.cSIHelperService.getServiceName().pipe(map(label => `Create Instance: ${label}`));
    this.marketPlaceMode = true;
    return this.cfOrgSpaceService.cf.list$.pipe(
      filter(p => !!p),
      first(),
      tap(e => this.cfOrgSpaceService.cf.select.next(cfId)),
      map(o => false),
    );
  }
}
