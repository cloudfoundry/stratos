import { AsyncPipe, CommonModule, TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { defer, Observable, of as observableOf, Subject } from 'rxjs';
import {
  catchError,
  delay,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AsyncPipe,
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
export class AddServiceInstanceComponent implements OnInit, OnDestroy {
  private cSIHelperServiceFactory = inject(CreateServiceInstanceHelperServiceFactory);
  private activatedRoute = inject(ActivatedRoute);
  private store = inject<Store<CFAppState>>(Store);
  private cfOrgSpaceService = inject(CfOrgSpaceDataService);
  private csiGuidsService = inject(CsiGuidsService);
  modeService = inject(CsiModeService);
  private cdr = inject(ChangeDetectorRef);

  initialisedService$!: Observable<boolean>;
  apps$!: Observable<APIResource<IApp>[]>;
  skipApps$!: Observable<boolean>;
  marketPlaceMode!: boolean;
  cSIHelperService!: CreateServiceInstanceHelper;
  displaySelectServiceStep!: boolean;
  displaySelectCfStep!: boolean;
  // Use signal for imperative title updates without change detection errors
  private _title = signal<string>('');
  title$ = toObservable(this._title);
  servicesWallCreateInstance = false;
  stepperText = 'Select a Cloud Foundry instance, organization and space for the service instance.';
  bindAppStepperText = 'Bind App (Optional)';
  appId!: string;
  serviceInstanceId!: string;
  public inMarketplaceMode: boolean;
  public serviceType: SERVICE_INSTANCE_TYPES;
  public serviceTypes = SERVICE_INSTANCE_TYPES;
  private cfDetails$ = this.store.select(selectCreateServiceInstance);
  // Lifecycle management for subscriptions - must be declared before use in property initializers
  private destroyed$ = new Subject<void>();
  // Loading state for applications - used to track async app fetching
  private _appsLoading = signal<boolean>(false);
  // toObservable() must run inside an injection context (constructor /
  // field initializer / runInInjectionContext) — Angular 21 enforces this
  // strictly. Calling toObservable() from onNext (an event handler) throws
  // NG0203. Lift the conversion up here where field initializers execute
  // during construction and have the injection context available, then
  // reuse this single observable from onNext.
  private appsLoading$ = toObservable(this._appsLoading);

  public cfGuid$: Observable<string>;
  public spaceGuid$ = this.cfDetails$.pipe(
    map(details => details?.spaceGuid),
    takeUntil(this.destroyed$)
  );
  public errorMessage: string | null = null;

  constructor() {
    const route = inject(ActivatedRoute);

    const cfGuid = getIdFromRoute(this.activatedRoute, 'endpointId');
    this.cfGuid$ = cfGuid ? observableOf(cfGuid) : this.cfDetails$.pipe(
      map(details => details?.cfGuid),
      catchError(error => {
        console.error('constructor: Error retrieving CF GUID from store', error);
        this.errorMessage = 'Failed to retrieve Cloud Foundry endpoint information';
        return observableOf(null);
      }),
      takeUntil(this.destroyed$)
    );
    this.inMarketplaceMode = this.modeService.isMarketplaceMode();
    this.serviceType = route.snapshot.params.type || SERVICE_INSTANCE_TYPES.SERVICE;

    // Initialize initialisedService$ with defer for lazy evaluation and proper timing
    // This ensures the observable is created when subscribed, not during construction
    this.initialisedService$ = defer(() => {
      try {
        if (this.inMarketplaceMode) {
          return this.initialiseForMarketplaceMode();
        }
        if (this.modeService.isEditServiceInstanceMode()) {
          return this.configureForEditServiceInstanceMode();
        }
        if (this.modeService.isAppServicesMode()) {
          return this.setupForAppServiceMode();
        }
        if (this.modeService.isServicesWallMode()) {
          this.servicesWallCreateInstance = true;
          // Use setTimeout to schedule title update outside current change detection cycle
          setTimeout(() => this._title.set('Create Service Instance'), 0);
          return observableOf(true);
        }
        return observableOf(true);
      } catch (error) {
        console.error('constructor: Error during initialization mode selection', error);
        this.errorMessage = 'Failed to initialize component';
        return observableOf(false);
      }
    }).pipe(
      catchError(error => {
        console.error('constructor: Error in initialisedService$ observable chain', error);
        this.errorMessage = 'Failed to initialize service instance creation';
        return observableOf(false);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
      takeUntil(this.destroyed$)
    );
  }

  ngOnInit(): void {
    // Trigger change detection after initialization to prevent NG0100
    // This ensures initialisedService$ emissions happen in the next cycle
    this.initialisedService$.pipe(
      take(1),
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      this.cdr.detectChanges();
    });

    // Initialize apps$ and skipApps$ observables for the stepper
    this.apps$ = this.store.select(selectCreateServiceInstance).pipe(
      filter(csi => !!csi && !!csi.spaceGuid && !!csi.cfGuid),
      distinctUntilChanged((x, y) => x.cfGuid + x.spaceGuid === y.cfGuid + y.spaceGuid),
      tap(() => this._appsLoading.set(true)),
      switchMap(csi => {
        const paginationKey = createEntityRelationPaginationKey(spaceEntityType, csi.spaceGuid);
        return cfEntityCatalog.application.store.getAllInSpace.getPaginationService(
          csi.spaceGuid, csi.cfGuid, paginationKey
        ).entities$;
      }),
      tap(() => this._appsLoading.set(false)),
      catchError(error => {
        console.error('Error fetching applications for space:', error);
        this.errorMessage = 'Failed to fetch applications. Please try again.';
        this._appsLoading.set(false);
        return observableOf([]);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
      takeUntil(this.destroyed$)
    );
    this.skipApps$ = this.apps$.pipe(
      map(apps => apps?.length === 0),
      catchError(() => observableOf(true)),
      shareReplay({ bufferSize: 1, refCount: true }),
      takeUntil(this.destroyed$)
    );
  }

  onNext = () => {
    try {
      const cfGuid = this.cfOrgSpaceService.cf.select.getValue();
      const orgGuid = this.cfOrgSpaceService.org.select.getValue();
      const spaceGuid = this.cfOrgSpaceService.space.select.getValue();

      if (!cfGuid) {
        console.error('onNext: Cloud Foundry endpoint not selected');
        this.errorMessage = 'Please select a Cloud Foundry endpoint';
        return observableOf({ success: false });
      }

      if (!orgGuid) {
        console.error('onNext: Organization not selected');
        this.errorMessage = 'Please select an organization';
        return observableOf({ success: false });
      }

      if (!spaceGuid) {
        console.error('onNext: Space not selected');
        this.errorMessage = 'Please select a space';
        return observableOf({ success: false });
      }

      this.store.dispatch(new SetCreateServiceInstanceCFDetails(cfGuid, orgGuid, spaceGuid));
    } catch (error) {
      console.error('onNext: Error dispatching CF details', error);
      this.errorMessage = 'Failed to save Cloud Foundry details';
      return observableOf({ success: false });
    }

    return this.appsLoading$.pipe(
      filter(loading => !loading),
      delay(1),
      map(() => ({ success: true })),
      catchError(error => {
        console.error('onNext: Error waiting for applications to load', error);
        this.errorMessage = 'Failed to load applications';
        return observableOf({ success: false });
      }),
      takeUntil(this.destroyed$)
    );
  }

  resetStoreData = () => {
    try {
      if (this.inMarketplaceMode) {
        this.store.dispatch(new ResetCreateServiceInstanceOrgAndSpaceState());
      } else if (this.modeService.isServicesWallMode()) {
        this.store.dispatch(new ResetCreateServiceInstanceState());
      }
    } catch (error) {
      console.error('resetStoreData: Error resetting store state', error);
      // Non-critical operation, just log the error
    }
  }

  private setupForAppServiceMode() {
    const appId = getIdFromRoute(this.activatedRoute, 'id');
    const cfId = getIdFromRoute(this.activatedRoute, 'endpointId');

    if (!appId) {
      console.error('setupForAppServiceMode: Application ID is missing from route params');
      this.errorMessage = 'Cannot bind service instance: Application ID is required';
      return observableOf(false);
    }

    if (!cfId) {
      console.error('setupForAppServiceMode: Cloud Foundry endpoint ID is missing from route params');
      this.errorMessage = 'Cannot bind service instance: Cloud Foundry endpoint ID is required';
      return observableOf(false);
    }

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
        if (!spaceEntity?.entity) {
          console.error('setupForAppServiceMode: Space entity not found for application', appId);
          throw new Error('Application space information is missing');
        }
        if (!spaceEntity.entity.organization_guid) {
          console.error('setupForAppServiceMode: Organization GUID missing from space entity', spaceEntity);
          throw new Error('Organization information is missing from application space');
        }
        if (!app.entity.entity.space_guid) {
          console.error('setupForAppServiceMode: Space GUID missing from application entity', app.entity);
          throw new Error('Space GUID is missing from application');
        }
        this.store.dispatch(
          new SetCreateServiceInstanceCFDetails(cfId, spaceEntity.entity.organization_guid, app.entity.entity.space_guid)
        );
        // Use setTimeout to schedule title update outside current change detection cycle
        setTimeout(() => {
          this._title.set(`Create and/or Bind Service Instance to '${app?.entity?.entity?.name || 'Application'}'`);
        }, 0);
      }),
      take(1),
      map(_o => true),
      catchError(error => {
        console.error('setupForAppServiceMode: Failed to fetch application details or space information', {
          appId,
          cfId,
          error
        });
        this.errorMessage = 'Failed to load application details. Please try again.';
        return observableOf(false);
      }),
      takeUntil(this.destroyed$)
    );
  }

  private configureForEditServiceInstanceMode() {
    const { endpointId, serviceInstanceId } = this.activatedRoute.snapshot.params;

    if (!endpointId) {
      console.error('configureForEditServiceInstanceMode: endpointId is missing from route params');
      this.errorMessage = 'Cannot edit service instance: Cloud Foundry endpoint ID is required';
      return observableOf(false);
    }

    if (!serviceInstanceId) {
      console.error('configureForEditServiceInstanceMode: serviceInstanceId is missing from route params');
      this.errorMessage = 'Cannot edit service instance: Service instance ID is required';
      return observableOf(false);
    }

    if (this.serviceType === this.serviceTypes.USER_SERVICE) {
      this.serviceInstanceId = serviceInstanceId;
      // Use setTimeout to schedule title update outside current change detection cycle
      setTimeout(() => this._title.set('Edit User Provided Service Instance'), 0);
      return observableOf(true);
    } else {
      return cfEntityCatalog.serviceInstance.store.getEntityService(serviceInstanceId, endpointId).waitForEntity$.pipe(
        filter(p => !!p),
        switchMap(serviceInstance => {
          const serviceInstanceEntity = serviceInstance?.entity?.entity;
          if (!serviceInstanceEntity) {
            console.error('configureForEditServiceInstanceMode: Service instance entity not found', {
              serviceInstanceId,
              endpointId
            });
            throw new Error('Service instance entity not found');
          }

          this.csiGuidsService.cfGuid = endpointId;
          // Use setTimeout to schedule title update outside current change detection cycle
          setTimeout(() => {
            this._title.set(`Edit Service Instance: ${serviceInstanceEntity.name}`);
          }, 0);
          const serviceGuid = serviceInstanceEntity.service_guid;

          if (!serviceGuid) {
            console.error('configureForEditServiceInstanceMode: service_guid is missing from service instance entity', {
              serviceInstanceId,
              serviceInstanceEntity
            });
            throw new Error('Cannot edit service instance: Service GUID is required but missing from service instance data');
          }

          if (!serviceInstanceEntity.space_guid) {
            console.error('configureForEditServiceInstanceMode: space_guid is missing from service instance entity', {
              serviceInstanceId,
              serviceInstanceEntity
            });
            throw new Error('Cannot edit service instance: Space GUID is required but missing from service instance data');
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
              if (!spaceEntity?.entity?.entity?.organization_guid) {
                console.error('configureForEditServiceInstanceMode: organization_guid missing from space entity', {
                  spaceGuid: serviceInstanceEntity.space_guid,
                  spaceEntity
                });
                throw new Error('Organization GUID is missing from space entity');
              }
              if (!spaceEntity?.entity?.metadata?.guid) {
                console.error('configureForEditServiceInstanceMode: space metadata guid missing from space entity', {
                  spaceGuid: serviceInstanceEntity.space_guid,
                  spaceEntity
                });
                throw new Error('Space metadata GUID is missing from space entity');
              }
              this.store.dispatch(new SetCreateServiceInstanceCFDetails(
                endpointId,
                spaceEntity.entity.entity.organization_guid,
                spaceEntity.entity.metadata.guid)
              );
            }),
            take(1),
            catchError(error => {
              console.error('configureForEditServiceInstanceMode: Failed to fetch space entity', {
                spaceGuid: serviceInstanceEntity.space_guid,
                endpointId,
                error
              });
              this.errorMessage = 'Failed to load space information for service instance.';
              return observableOf(false);
            })
          );
        }),
        take(1),
        map(_o => true),
        catchError(error => {
          console.error('configureForEditServiceInstanceMode: Failed to configure edit mode', {
            serviceInstanceId,
            endpointId,
            error
          });
          this.errorMessage = 'Failed to load service instance for editing. Please try again.';
          return observableOf(false);
        }),
        takeUntil(this.destroyed$)
      );
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    try {
      this.store.dispatch(new ResetCreateServiceInstanceState());
    } catch (error) {
      console.error('ngOnDestroy: Error dispatching reset state action', error);
      // Non-critical during cleanup, just log
    }
  }

  isSpaceScoped = () => this.modeService.spaceScopedDetails.isSpaceScoped;

  private initialiseForMarketplaceMode(): Observable<boolean> {
    const { endpointId, serviceId } = this.activatedRoute.snapshot.params;

    if (!endpointId) {
      console.error('initialiseForMarketplaceMode: endpointId is missing from route params');
      this.errorMessage = 'Cannot initialize service instance creation: Cloud Foundry endpoint ID is required';
      return observableOf(false);
    }

    if (!serviceId) {
      console.error('initialiseForMarketplaceMode: serviceId is missing from route params');
      this.errorMessage = 'Cannot initialize service instance creation: Service ID is required';
      return observableOf(false);
    }

    try {
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
    } catch (error) {
      console.error('initialiseForMarketplaceMode: Error during service configuration', {
        endpointId,
        serviceId,
        error
      });
      this.errorMessage = 'Failed to configure service instance creation.';
      return observableOf(false);
    }

    // Subscribe to service name and update title imperatively
    // Use setTimeout to schedule title update outside current change detection cycle
    // This prevents ExpressionChangedAfterItHasBeenCheckedError
    this.cSIHelperService.getServiceName().pipe(
      map(label => `Create Instance: ${label || 'Service'}`),
      catchError(error => {
        console.error('initialiseForMarketplaceMode: Failed to fetch service name', {
          serviceId,
          endpointId,
          error
        });
        return observableOf('Create Service Instance');
      }),
      takeUntil(this.destroyed$)
    ).subscribe(title => {
      setTimeout(() => this._title.set(title), 0);
    });
    this.marketPlaceMode = true;
    return this.cfOrgSpaceService.cf.list$.pipe(
      filter(p => !!p),
      take(1),
      tap(e => {
        if (!e || e.length === 0) {
          console.error('initialiseForMarketplaceMode: No Cloud Foundry endpoints available');
          throw new Error('No Cloud Foundry endpoints available');
        }
        this.cfOrgSpaceService.cf.select.next(endpointId);
      }),
      map(_o => true),
      catchError(error => {
        console.error('initialiseForMarketplaceMode: Failed to initialize marketplace mode', {
          endpointId,
          serviceId,
          error
        });
        this.errorMessage = 'Failed to initialize service creation. Please ensure your Cloud Foundry connection is active.';
        return observableOf(false);
      }),
      takeUntil(this.destroyed$)
    );
  }
}
