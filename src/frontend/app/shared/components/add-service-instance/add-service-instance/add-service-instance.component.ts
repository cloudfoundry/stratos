import { TitleCasePipe } from '@angular/common';
import { AfterContentInit, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { filter, first, map, switchMap, take, tap } from 'rxjs/operators';

import { IServiceInstance } from '../../../../core/cf-api-svc.types';
import { IApp, ISpace } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { getIdFromRoute } from '../../../../features/cloud-foundry/cf.helpers';
import { servicesServiceFactoryProvider } from '../../../../features/service-catalog/service-catalog.helpers';
import { GetApplication } from '../../../../store/actions/application.actions';
import {
  ResetCreateServiceInstanceOrgAndSpaceState,
  ResetCreateServiceInstanceState,
  SetCreateServiceInstance,
  SetCreateServiceInstanceCFDetails,
  SetCreateServiceInstanceServiceGuid,
  SetCreateServiceInstanceServicePlan,
  SetServiceInstanceGuid,
} from '../../../../store/actions/create-service-instance.actions';
import { GetServiceInstance } from '../../../../store/actions/service-instances.actions';
import { GetAllAppsInSpace, GetSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import {
  applicationSchemaKey,
  entityFactory,
  serviceInstancesSchemaKey,
  spaceSchemaKey,
} from '../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../store/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelper } from '../create-service-instance-helper.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CsiModeService } from '../csi-mode.service';

@Component({
  selector: 'app-add-service-instance',
  templateUrl: './add-service-instance.component.html',
  styleUrls: ['./add-service-instance.component.scss'],
  providers: [
    servicesServiceFactoryProvider,
    CreateServiceInstanceHelperServiceFactory,
    TitleCasePipe,
    CsiGuidsService,
    CsiModeService,
    CfOrgSpaceDataService
  ]
})
export class AddServiceInstanceComponent implements OnDestroy, AfterContentInit {
  initialisedService$: Observable<boolean>;
  skipApps$: Observable<boolean>;
  marketPlaceMode: boolean;
  cSIHelperService: CreateServiceInstanceHelper;
  displaySelectServiceStep: boolean;
  displaySelectCfStep: boolean;
  title$: Observable<string>;
  servicesWallCreateInstance = false;
  stepperText = 'Select a Cloud Foundry instance, organization and space for the service instance.';
  bindAppStepperText = 'Bind App (Optional)';
  appId: string;
  public inMarketplaceMode: boolean;
  constructor(
    private cSIHelperServiceFactory: CreateServiceInstanceHelperServiceFactory,
    private activatedRoute: ActivatedRoute,
    private store: Store<AppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    private csiGuidsService: CsiGuidsService,
    private entityServiceFactory: EntityServiceFactory,
    public modeService: CsiModeService,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.inMarketplaceMode = this.modeService.isMarketplaceMode();
  }
  ngAfterContentInit(): void {
    // Check if wizard has been initiated from the Services Marketplace
    if (this.inMarketplaceMode) {
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
      this.title$ = observableOf(`Create Service Instance`);
    }

    this.skipApps$ = this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p && !!p.spaceGuid && !!p.cfGuid),
      switchMap(createServiceInstance => {
        const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, createServiceInstance.spaceGuid);
        return getPaginationObservables<APIResource<IApp>>({
          store: this.store,
          action: new GetAllAppsInSpace(createServiceInstance.cfGuid, createServiceInstance.spaceGuid, paginationKey),
          paginationMonitor: this.paginationMonitorFactory.create(paginationKey, entityFactory(applicationSchemaKey))
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

  resetStoreData = () => {
    if (this.inMarketplaceMode) {
      this.store.dispatch(new ResetCreateServiceInstanceOrgAndSpaceState());
    } else if (this.modeService.isServicesWallMode()) {
      this.store.dispatch(new ResetCreateServiceInstanceState());
    }
  }

  private getIdsFromRoute() {
    const serviceId = getIdFromRoute(this.activatedRoute, 'serviceId');
    const cfId = getIdFromRoute(this.activatedRoute, 'endpointId');
    const appId = getIdFromRoute(this.activatedRoute, 'id');
    return { serviceId, cfId, appId };
  }

  private setupForAppServiceMode() {

    const appId = getIdFromRoute(this.activatedRoute, 'id');
    const cfId = getIdFromRoute(this.activatedRoute, 'endpointId');
    this.appId = appId;
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
    const { endpointId, serviceInstanceId } = this.activatedRoute.snapshot.params;
    const entityService = this.getServiceInstanceEntityService(serviceInstanceId, endpointId);
    return entityService.waitForEntity$.pipe(
      filter(p => !!p),
      tap(serviceInstance => {
        const serviceInstanceEntity = serviceInstance.entity.entity;
        this.csiGuidsService.cfGuid = endpointId;
        this.title$ = observableOf(`Edit Service Instance: ${serviceInstanceEntity.name}`);
        const serviceGuid = serviceInstance.entity.entity.service_guid;
        this.csiGuidsService.serviceGuid = serviceGuid;
        this.cSIHelperService = this.cSIHelperServiceFactory.create(endpointId, serviceGuid);
        this.store.dispatch(new SetCreateServiceInstanceServiceGuid(serviceGuid));
        this.store.dispatch(new SetServiceInstanceGuid(serviceInstance.entity.metadata.guid));
        this.store.dispatch(new SetCreateServiceInstance(
          serviceInstanceEntity.name,
          serviceInstanceEntity.space_guid,
          serviceInstanceEntity.tags,
          ''
        ));
        this.store.dispatch(new SetCreateServiceInstanceServicePlan(serviceInstanceEntity.service_plan_guid));
        const spaceEntityService = this.getSpaceEntityService(serviceInstanceEntity.space_guid, endpointId);
        spaceEntityService.waitForEntity$.pipe(
          filter(p => !!p),
          tap(spaceEntity => {
            this.store.dispatch(new SetCreateServiceInstanceCFDetails(
              endpointId,
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

  isSpaceScoped = () => this.modeService.spaceScopedDetails.isSpaceScoped;

  private initialiseForMarketplaceMode(): Observable<boolean> {
    const { endpointId, serviceId } = this.activatedRoute.snapshot.params;
    this.csiGuidsService.cfGuid = endpointId;
    this.csiGuidsService.serviceGuid = serviceId;
    this.cSIHelperService = this.cSIHelperServiceFactory.create(endpointId, serviceId);
    const cfDetails = new SetCreateServiceInstanceCFDetails(endpointId);
    if (this.modeService.spaceScopedDetails.isSpaceScoped) {
      cfDetails.spaceGuid = this.modeService.spaceScopedDetails.spaceGuid;
      cfDetails.orgGuid = this.modeService.spaceScopedDetails.orgGuid;
    }
    this.store.dispatch(cfDetails);
    this.store.dispatch(new SetCreateServiceInstanceServiceGuid(serviceId));
    this.title$ = this.cSIHelperService.getServiceName().pipe(map(label => `Create Instance: ${label}`));
    this.marketPlaceMode = true;
    return this.cfOrgSpaceService.cf.list$.pipe(
      filter(p => !!p),
      first(),
      tap(e => this.cfOrgSpaceService.cf.select.next(endpointId)),
      map(o => false),
    );
  }
}
