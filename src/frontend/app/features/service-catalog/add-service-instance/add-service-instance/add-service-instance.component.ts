import { TitleCasePipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';

import { IServiceInstance } from '../../../../core/cf-api-svc.types';
import { IApp, ISpace } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { GetApplication } from '../../../../store/actions/application.actions';
import {
  ResetCreateServiceInstanceState,
  SetCreateServiceInstance,
  SetCreateServiceInstanceCFDetails,
  SetCreateServiceInstanceServiceGuid,
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
} from '../../../../store/helpers/entity-relations.types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { getIdFromRoute } from '../../../cloud-foundry/cf.helpers';
import { servicesServiceFactoryProvider } from '../../service-catalog.helpers';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelperService } from '../create-service-instance-helper.service';
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
    CsiModeService
  ]
})
export class AddServiceInstanceComponent implements OnDestroy {

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


    // Check if wizard has been initiated from the Services Marketplace
    if (this.modeService.isMarketplaceMode()) {
      this.configureForMarketplaceMode();
    }

    // Check if wizard has been initiated to edit a service instance
    if (this.modeService.isEditServiceInstanceMode()) {
      this.configureForEditServiceInstanceMode();
    }

    if (this.modeService.isAppServicesMode()) {
      // Setup wizard for App services mode
      this.setupForAppServiceMode();
    }
    if (this.modeService.isServicesWallMode()) {
      // Setup wizard for default mode
      this.servicesWallCreateInstance = true;
      this.serviceInstancesUrl = `/services`;
      this.title$ = Observable.of(`Create Service Instance`);
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
    return Observable.of({ success: true });
  }

  private getIdsFromRoute() {
    const serviceId = getIdFromRoute(this.activatedRoute, 'serviceId');
    const cfId = getIdFromRoute(this.activatedRoute, 'cfId');
    const id = getIdFromRoute(this.activatedRoute, 'id');
    return { serviceId, cfId, id };
  }

  private setupForAppServiceMode() {

    const id = getIdFromRoute(this.activatedRoute, 'id');
    const cfId = getIdFromRoute(this.activatedRoute, 'cfId');
    this.appId = id;
    this.serviceInstancesUrl = `/applications/${cfId}/${id}/services`;
    this.bindAppStepperText = 'Binding Params (Optional)';
    const entityService = this.entityServiceFactory.create<APIResource<IApp>>(
      applicationSchemaKey,
      entityFactory(applicationSchemaKey),
      id,
      new GetApplication(id, cfId, [createEntityRelationKey(applicationSchemaKey, spaceSchemaKey)]),
      true);
    entityService.waitForEntity$.pipe(filter(p => !!p), tap(app => {
      const spaceEntity = app.entity.entity.space as APIResource<ISpace>;
      this.store.dispatch(new SetCreateServiceInstanceCFDetails(cfId, spaceEntity.entity.organization_guid, app.entity.entity.space_guid));
      this.title$ = Observable.of(`Create Or Bind Service Instance to '${app.entity.entity.name}'`);
    }), take(1)).subscribe();
  }

  private configureForMarketplaceMode() {
    const { cfId, serviceId } = this.activatedRoute.snapshot.params;
    this.csiGuidsService.cfGuid = cfId;
    this.csiGuidsService.serviceGuid = serviceId;
    this.cSIHelperService = this.cSIHelperServiceFactory.create(cfId, serviceId);
    this.store.dispatch(new SetCreateServiceInstanceCFDetails(cfId));
    this.store.dispatch(new SetCreateServiceInstanceServiceGuid(serviceId));
    this.initialiseForMarketplaceMode(serviceId, cfId);
    this.cfOrgSpaceService.cf.list$.pipe(
      filter(p => !!p),
      map(endpoints => endpoints.filter(e => e.guid === cfId)),
      map(e => e[0]),
      tap(e => this.cfOrgSpaceService.cf.select.next(e.guid)),
      take(1)
    ).subscribe();
  }

  private configureForEditServiceInstanceMode() {
    const { cfId, serviceInstanceId } = this.activatedRoute.snapshot.params;

    const entityService = this.getServiceInstanceEntityService(serviceInstanceId, cfId);
    entityService.waitForEntity$.pipe(
      filter(p => !!p),
      tap(serviceInstance => {
        const serviceInstanceEntity = serviceInstance.entity.entity;
        this.csiGuidsService.cfGuid = cfId;
        this.title$ = Observable.of(`Edit Service Instance: ${serviceInstanceEntity.name}`);
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
        this.serviceInstancesUrl = `/services`;
      }),
      take(1)
    ).subscribe();
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

  private initialiseForMarketplaceMode(serviceId: string, cfId: string) {
    const serviceGuid = serviceId;
    this.serviceInstancesUrl = `/marketplace/${cfId}/${serviceGuid}/instances`;
    this.title$ = this.cSIHelperService.getServiceName().pipe(map(label => `Create Instance: ${label}`));
  }
}
