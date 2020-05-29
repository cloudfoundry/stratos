import { TitleCasePipe } from '@angular/common';
import { AfterContentInit, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import {
  delay,
  distinctUntilChanged,
  filter,
  first,
  map,
  publishReplay,
  refCount,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';

import {
  ResetCreateServiceInstanceOrgAndSpaceState,
  ResetCreateServiceInstanceState,
  SetCreateServiceInstance,
  SetCreateServiceInstanceCFDetails,
  SetCreateServiceInstanceServiceGuid,
  SetCreateServiceInstanceServicePlan,
  SetServiceInstanceGuid,
} from '../../../../../../cloud-foundry/src/actions/create-service-instance.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { applicationEntityType, spaceEntityType } from '../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  servicesServiceFactoryProvider,
} from '../../../../../../cloud-foundry/src/features/service-catalog/service-catalog.helpers';
import {
  CfOrgSpaceDataService,
} from '../../../../../../cloud-foundry/src/shared/data-services/cf-org-space-service.service';
import {
  selectCreateServiceInstance,
} from '../../../../../../cloud-foundry/src/store/selectors/create-service-instance.selectors';
import { getIdFromRoute } from '../../../../../../core/src/core/utils.service';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IApp, ISpace } from '../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { SERVICE_INSTANCE_TYPES } from '../add-service-instance-base-step/add-service-instance.types';
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
  apps$: Observable<APIResource<IApp>[]>;
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
  serviceInstanceId: string;
  public inMarketplaceMode: boolean;
  public serviceType: SERVICE_INSTANCE_TYPES;
  public serviceTypes = SERVICE_INSTANCE_TYPES;
  private cfDetails$ = this.store.select(selectCreateServiceInstance);
  public cfGuid$: Observable<string>;
  public spaceGuid$ = this.cfDetails$.pipe(
    map(details => details.spaceGuid)
  );

  constructor(
    private cSIHelperServiceFactory: CreateServiceInstanceHelperServiceFactory,
    private activatedRoute: ActivatedRoute,
    private store: Store<CFAppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    private csiGuidsService: CsiGuidsService,
    public modeService: CsiModeService,
    route: ActivatedRoute
  ) {
    const cfGuid = getIdFromRoute(this.activatedRoute, 'endpointId');
    this.cfGuid$ = cfGuid ? observableOf(cfGuid) : this.cfDetails$.pipe(
      map(details => details.cfGuid)
    );
    this.inMarketplaceMode = this.modeService.isMarketplaceMode();
    this.serviceType = route.snapshot.params.type || SERVICE_INSTANCE_TYPES.SERVICE;
  }

  appsEmitted = new BehaviorSubject(null);
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

    if (!this.initialisedService$) {
      this.initialisedService$ = observableOf(true);
    }

    this.apps$ = this.store.select(selectCreateServiceInstance).pipe(
      filter(csi => !!csi && !!csi.spaceGuid && !!csi.cfGuid),
      distinctUntilChanged((x, y) => x.cfGuid + x.spaceGuid === y.cfGuid + y.spaceGuid),
      switchMap(csi => {
        this.appsEmitted.next(false);
        const paginationKey = createEntityRelationPaginationKey(spaceEntityType, csi.spaceGuid);
        return cfEntityCatalog.application.store.getAllInSpace.getPaginationService(
          csi.spaceGuid, csi.cfGuid, paginationKey
        ).entities$;
      }),
      tap(() => this.appsEmitted.next(true)),
      publishReplay(1),
      refCount(),
    );
    this.skipApps$ = this.apps$.pipe(
      map(apps => apps.length === 0),
      publishReplay(1),
      refCount(),
    );
  }

  onNext = () => {
    this.store.dispatch(new SetCreateServiceInstanceCFDetails(
      this.cfOrgSpaceService.cf.select.getValue(),
      this.cfOrgSpaceService.org.select.getValue(),
      this.cfOrgSpaceService.space.select.getValue()
    ));
    return this.appsEmitted.asObservable().pipe(
      filter(emitted => emitted),
      delay(1),
      map(() => ({ success: true })),
    );
  }

  resetStoreData = () => {
    if (this.inMarketplaceMode) {
      this.store.dispatch(new ResetCreateServiceInstanceOrgAndSpaceState());
    } else if (this.modeService.isServicesWallMode()) {
      this.store.dispatch(new ResetCreateServiceInstanceState());
    }
  }

  private setupForAppServiceMode() {
    const appId = getIdFromRoute(this.activatedRoute, 'id');
    const cfId = getIdFromRoute(this.activatedRoute, 'endpointId');
    this.appId = appId;
    this.bindAppStepperText = 'Binding Params (Optional)';
    return cfEntityCatalog.application.store.getEntityService(
      appId,
      cfId, {
        includeRelations: [createEntityRelationKey(applicationEntityType, spaceEntityType)]
      }
    ).waitForEntity$.pipe(
      filter(p => !!p),
      tap(app => {
        const spaceEntity = app.entity.entity.space as APIResource<ISpace>;
        this.store.dispatch(
          new SetCreateServiceInstanceCFDetails(cfId, spaceEntity.entity.organization_guid, app.entity.entity.space_guid)
        );
        this.title$ = observableOf(`Create and/or Bind Service Instance to '${app.entity.entity.name}'`);
      }),
      take(1),
      map(o => true)
    );
  }

  private configureForEditServiceInstanceMode() {
    const { endpointId, serviceInstanceId } = this.activatedRoute.snapshot.params;
    if (this.serviceType === this.serviceTypes.USER_SERVICE) {
      this.serviceInstanceId = serviceInstanceId;
      this.title$ = observableOf('Edit User Provided Service Instance');
    } else {
      return cfEntityCatalog.serviceInstance.store.getEntityService(serviceInstanceId, endpointId).waitForEntity$.pipe(
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
          cfEntityCatalog.space.store.getEntityService(serviceInstanceEntity.space_guid, endpointId).waitForEntity$.pipe(
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
        map(o => true),
      );
    }
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
      map(o => true),
    );
  }
}
