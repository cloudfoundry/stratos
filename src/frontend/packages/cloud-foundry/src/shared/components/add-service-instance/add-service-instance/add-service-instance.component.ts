import { AsyncPipe, CommonModule, NgIf, TitleCasePipe } from '@angular/common';
import { AfterContentInit, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, EMPTY, Observable, of as observableOf, Subject } from 'rxjs';
import {
  catchError,
  delay,
  distinctUntilChanged,
  filter,
  first,
  map,
  publishReplay,
  refCount,
  switchMap,
  take,
  takeUntil,
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
import { PageHeaderComponent } from '../../../../../../core/src/shared/components/page-header/page-header.component';
import { StepComponent } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IApp, ISpace } from '../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { CreateApplicationStep1Component } from '../../create-application/create-application-step1/create-application-step1.component';
import { SelectServiceComponent } from '../../select-service/select-service.component';
import { SERVICE_INSTANCE_TYPES } from '../add-service-instance-base-step/add-service-instance.types';
import { BindAppsStepComponent } from '../bind-apps-step/bind-apps-step.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelper } from '../create-service-instance-helper.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CsiModeService } from '../csi-mode.service';
import { SelectPlanStepComponent } from '../select-plan-step/select-plan-step.component';
import { SpecifyDetailsStepComponent } from '../specify-details-step/specify-details-step.component';
import { SpecifyUserProvidedDetailsComponent } from '../specify-user-provided-details/specify-user-provided-details.component';

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
  ],
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    NgIf,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    CreateApplicationStep1Component,
    SelectServiceComponent,
    SelectPlanStepComponent,
    BindAppsStepComponent,
    SpecifyDetailsStepComponent,
    SpecifyUserProvidedDetailsComponent
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
  // Lifecycle management for subscriptions - must be declared before use in property initializers
  private destroyed$ = new Subject<void>();

  public cfGuid$: Observable<string>;
  public spaceGuid$ = this.cfDetails$.pipe(
    map(details => details?.spaceGuid),
    takeUntil(this.destroyed$)
  );
  public errorMessage: string | null = null;

  constructor(
    private cSIHelperServiceFactory: CreateServiceInstanceHelperServiceFactory,
    private activatedRoute: ActivatedRoute,
    private store: Store<CFAppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    private csiGuidsService: CsiGuidsService,
    public modeService: CsiModeService,
    private cdr: ChangeDetectorRef,
    route: ActivatedRoute
  ) {
    const cfGuid = getIdFromRoute(this.activatedRoute, 'endpointId');
    this.cfGuid$ = cfGuid ? observableOf(cfGuid) : this.cfDetails$.pipe(
      map(details => details?.cfGuid),
      takeUntil(this.destroyed$)
    );
    this.inMarketplaceMode = this.modeService.isMarketplaceMode();
    this.serviceType = route.snapshot.params.type || SERVICE_INSTANCE_TYPES.SERVICE;
    // Initialize title$ with empty observable to prevent ExpressionChangedAfterItHasBeenCheckedError
    this.title$ = observableOf('');
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
      // Defer title update to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.title$ = observableOf(`Create Service Instance`);
      });
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
      catchError(error => {
        console.error('Error fetching applications for space:', error);
        this.errorMessage = 'Failed to fetch applications. Please try again.';
        this.appsEmitted.next(true);
        return observableOf([]);
      }),
      publishReplay(1),
      refCount(),
      takeUntil(this.destroyed$)
    );
    this.skipApps$ = this.apps$.pipe(
      map(apps => apps?.length === 0),
      catchError(() => observableOf(true)),
      publishReplay(1),
      refCount(),
      takeUntil(this.destroyed$)
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
      takeUntil(this.destroyed$)
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
        const spaceEntity = app?.entity?.entity?.space as APIResource<ISpace>;
        if (spaceEntity?.entity) {
          this.store.dispatch(
            new SetCreateServiceInstanceCFDetails(cfId, spaceEntity.entity.organization_guid, app.entity.entity.space_guid)
          );
          // Defer title update to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.title$ = observableOf(`Create and/or Bind Service Instance to '${app?.entity?.entity?.name || 'Application'}'`);
          });
        }
      }),
      take(1),
      map(o => true),
      catchError(error => {
        console.error('Error setting up app service mode:', error);
        this.errorMessage = 'Failed to load application details.';
        return observableOf(false);
      }),
      takeUntil(this.destroyed$)
    );
  }

  private configureForEditServiceInstanceMode() {
    const { endpointId, serviceInstanceId } = this.activatedRoute.snapshot.params;

    if (!endpointId) {
      console.error('Edit service instance mode initialization failed: endpointId is missing from route params');
      this.errorMessage = 'Cannot edit service instance: Cloud Foundry endpoint ID is required';
      return observableOf(false);
    }

    if (!serviceInstanceId) {
      console.error('Edit service instance mode initialization failed: serviceInstanceId is missing from route params');
      this.errorMessage = 'Cannot edit service instance: Service instance ID is required';
      return observableOf(false);
    }

    if (this.serviceType === this.serviceTypes.USER_SERVICE) {
      this.serviceInstanceId = serviceInstanceId;
      // Defer title update to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.title$ = observableOf('Edit User Provided Service Instance');
      });
      return observableOf(true);
    } else {
      return cfEntityCatalog.serviceInstance.store.getEntityService(serviceInstanceId, endpointId).waitForEntity$.pipe(
        filter(p => !!p),
        switchMap(serviceInstance => {
          const serviceInstanceEntity = serviceInstance?.entity?.entity;
          if (!serviceInstanceEntity) {
            throw new Error('Service instance entity not found');
          }

          this.csiGuidsService.cfGuid = endpointId;
          // Defer title update to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.title$ = observableOf(`Edit Service Instance: ${serviceInstanceEntity.name}`);
          });
          const serviceGuid = serviceInstanceEntity.service_guid;

          if (!serviceGuid) {
            console.error('Edit service instance failed: service_guid is missing from service instance entity', serviceInstanceEntity);
            throw new Error('Cannot edit service instance: Service GUID is required but missing from service instance data');
          }

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

          // Chain the space entity fetch instead of nested subscribe
          return cfEntityCatalog.space.store.getEntityService(serviceInstanceEntity.space_guid, endpointId).waitForEntity$.pipe(
            filter(p => !!p),
            tap(spaceEntity => {
              this.store.dispatch(new SetCreateServiceInstanceCFDetails(
                endpointId,
                spaceEntity?.entity?.entity?.organization_guid,
                spaceEntity?.entity?.metadata?.guid)
              );
            }),
            take(1),
            catchError(error => {
              console.error('Error fetching space entity:', error);
              return EMPTY;
            })
          );
        }),
        take(1),
        map(o => true),
        catchError(error => {
          console.error('Error configuring edit mode:', error);
          this.errorMessage = 'Failed to load service instance for editing.';
          return observableOf(false);
        }),
        takeUntil(this.destroyed$)
      );
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.store.dispatch(new ResetCreateServiceInstanceState());
  }

  isSpaceScoped = () => this.modeService.spaceScopedDetails.isSpaceScoped;

  private initialiseForMarketplaceMode(): Observable<boolean> {
    const { endpointId, serviceId } = this.activatedRoute.snapshot.params;

    if (!endpointId) {
      console.error('Marketplace mode initialization failed: endpointId is missing from route params');
      this.errorMessage = 'Cannot initialize service instance creation: Cloud Foundry endpoint ID is required';
      return observableOf(false);
    }

    if (!serviceId) {
      console.error('Marketplace mode initialization failed: serviceId is missing from route params');
      this.errorMessage = 'Cannot initialize service instance creation: Service ID is required';
      return observableOf(false);
    }

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
    // Defer title update to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.title$ = this.cSIHelperService.getServiceName().pipe(
        map(label => `Create Instance: ${label || 'Service'}`),
        catchError(error => {
          console.error('Error fetching service name:', error);
          return observableOf('Create Service Instance');
        }),
        takeUntil(this.destroyed$)
      );
    });
    this.marketPlaceMode = true;
    return this.cfOrgSpaceService.cf.list$.pipe(
      filter(p => !!p),
      first(),
      tap(e => this.cfOrgSpaceService.cf.select.next(endpointId)),
      map(o => true),
      catchError(error => {
        console.error('Error initializing marketplace mode:', error);
        this.errorMessage = 'Failed to initialize service creation.';
        return observableOf(false);
      }),
      takeUntil(this.destroyed$)
    );
  }
}
