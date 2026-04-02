import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, ReplaySubject } from 'rxjs';
import { take, filter, map, pairwise, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

import {
  AppMonitorComponentTypes,
  ITableColumn,
  LoadingPageComponent,
  PageHeaderComponent,
  StepComponent,
  SteppersComponent } from '@stratosui/core';
import {
  RouterNav,
  GeneralEntityAppState,
  entityCatalog,
  EntityMonitor,
  PaginationMonitor,
  PaginationMonitorFactory,
  RequestInfoState,
  APIResource } from '@stratosui/store';
import {
  applicationEntityType,
  routeEntityType,
  serviceInstancesEntityType,
  userProvidedServiceInstanceEntityType,
  IServiceBinding,
  IApp,
  IRoute,
  cfEntityCatalog,
  CF_ENDPOINT_TYPE,
  CfAppRoutesListConfigService,
  AppServiceBindingDataSource,
  AppServiceBindingListConfigService,
  TableCellAppInstancesComponent,
  TableCellAppStatusComponent,
  TableCellRouteComponent,
  TableCellTCPRouteComponent,
  isServiceInstance,
  isUserProvidedServiceInstance,
  ApplicationService } from '@stratosui/cloud-foundry';


@Component({
  selector: 'app-application-delete',
  templateUrl: './application-delete.component.html',
  styleUrls: ['./application-delete.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    LoadingPageComponent,
  ],
  providers: [
    CfAppRoutesListConfigService,
    AppServiceBindingListConfigService
  ]
})
export class ApplicationDeleteComponent<T> {
  private store = inject<Store<GeneralEntityAppState>>(Store);
  private applicationService = inject(ApplicationService);
  private paginationMonitorFactory = inject(PaginationMonitorFactory);
  private datePipe = inject(DatePipe);

  relatedEntities$: Observable<{ instances: APIResource<IServiceBinding>[], routes: APIResource<IRoute>[]; }>;
  public deleteStarted = false;
  public instanceDeleteColumns: ITableColumn<APIResource<IServiceBinding>>[] = [
    {
      headerCell: () => 'Name',
      columnId: 'name',
      cellDefinition: {
        getValue: row => row.entity.service_instance.entity.name
      },
      cellFlex: '1 0'
    },
    {
      columnId: 'service',
      headerCell: () => 'Service',
      cellDefinition: {
        getValue: (row) => {
          const si = isServiceInstance(row.entity.service_instance.entity);
          return si ? si.service_plan.entity.service.entity.label : 'User Service';
        }
      },
      cellFlex: '2'
    },
    {
      columnId: 'creation',
      headerCell: () => 'Creation Date',
      cellDefinition: {
        getValue: (row: APIResource) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`
      },
      sort: {
        type: 'sort',
        orderKey: 'creation',
        field: 'metadata.created_at'
      },
      cellFlex: '1'
    }
  ];
  public routeDeleteColumns: ITableColumn<APIResource<IRoute>>[] = [
    {
      headerCell: () => 'Host',
      columnId: 'host',
      cellComponent: TableCellRouteComponent,
      cellFlex: '1 0'
    },
    {
      columnId: 'tcproute',
      headerCell: () => 'TCP Route',
      cellComponent: TableCellTCPRouteComponent,
      cellFlex: '1'
    }
  ];
  public appDeleteColumns: ITableColumn<APIResource<IApp>>[] = [
    {
      headerCell: () => 'Name',
      columnId: 'name',
      cellDefinition: {
        getValue: row => row.entity.name,
        getLink: row => `/applications/${row.metadata.guid}`,
        newTab: true },
      cellFlex: '1 0'
    },
    {
      columnId: 'status',
      headerCell: () => 'Status',
      cellComponent: TableCellAppStatusComponent,
      cellFlex: '1'
    },
    {
      columnId: 'instances',
      headerCell: () => 'Instances',
      cellComponent: TableCellAppInstancesComponent,
      cellFlex: '1'
    },
    {
      columnId: 'creation',
      headerCell: () => 'Creation Date',
      cellDefinition: {
        getValue: (row: APIResource) => this.datePipe.transform(row.metadata.created_at, 'medium')
      },
      cellFlex: '1'
    }
  ];

  public selectedRoutes!: APIResource<IRoute>[];
  public selectedServiceInstances!: APIResource<IServiceBinding>[];
  public fetchingRelated$!: Observable<boolean>;
  public selectedApplication$!: Observable<APIResource<IApp>[]>;
  public selectedRoutes$ = new ReplaySubject<APIResource<IRoute>[]>(1);
  public selectedServiceInstances$ = new ReplaySubject<APIResource<IServiceBinding>[]>(1);
  public selectedUserServiceInstances$ = new ReplaySubject<APIResource<IServiceBinding>[]>(1);
  public fetchingApplicationData$!: Observable<boolean>;

  public deletingState = AppMonitorComponentTypes.DELETE;
  public routeMonitor!: PaginationMonitor<APIResource<IRoute>>;
  public instanceMonitor!: PaginationMonitor<APIResource<IServiceBinding>>;

  public appMonitor!: EntityMonitor<APIResource<IApp>>;

  public cancelUrl: string;

  public appCatalogEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, applicationEntityType);
  public routeCatalogEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, routeEntityType);
  public siCatalogEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceInstancesEntityType);
  public upsiCatalogEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, userProvidedServiceInstanceEntityType);

  constructor() {
    const applicationService = this.applicationService;

    this.setupAppMonitor();
    this.cancelUrl = `/applications/${applicationService.cfGuid}/${applicationService.appGuid}`;
    const { fetch, monitors } = this.buildRelatedEntitiesActionMonitors();
    const { instanceMonitor, routeMonitor } = monitors;
    this.instanceMonitor = instanceMonitor;
    this.routeMonitor = routeMonitor;

    this.relatedEntities$ = combineLatest(instanceMonitor.currentPage$, routeMonitor.currentPage$).pipe(
      filter(([instances, routes]) => !!routes && !!instances),
      map(([instances, routes]) => ({ instances, routes })),
    );

    // Are we fetching application routes or service instances?
    this.fetchingRelated$ = combineLatest(instanceMonitor.fetchingCurrentPage$, routeMonitor.fetchingCurrentPage$).pipe(
      map(([fetchingInstances, fetchingRoutes]) => fetchingInstances || fetchingRoutes),
      startWith(true)
    );
    // Wait until we've finished fetching the application, fetch the related entities and monitor there progress.
    this.fetchingApplicationData$ = this.finishedFetchingApplication().pipe(
      filter(finished => finished),
      take(1),
      tap(fetch),
      switchMap(() => this.fetchingRelated$),
      filter(fetching => !fetching),
      take(1),
      shareReplay(1),
      startWith(true)
    );

    cfEntityCatalog.application.api.get(applicationService.appGuid, applicationService.cfGuid, {});
  }

  private setupAppMonitor() {
    this.appMonitor = this.getApplicationMonitor();
    this.selectedApplication$ = this.appMonitor.entity$.pipe(
      filter(app => !!app),
      map(app => [app])
    );
  }

  public redirectToAppWall() {
    this.store.dispatch(new RouterNav({ path: '/applications' }));
  }

  public getApplicationMonitor() {
    return cfEntityCatalog.application.store.getEntityMonitor(this.applicationService.appGuid);
  }

  /**
   * Builds the related entities actions and monitors to monitor the state of the entities.
   */
  public buildRelatedEntitiesActionMonitors() {
    const { appGuid, cfGuid } = this.applicationService;
    const instanceAction = AppServiceBindingDataSource.createGetAllServiceBindings(appGuid, cfGuid);
    const instanceMonitor = this.paginationMonitorFactory.create<APIResource<IServiceBinding>>(
      instanceAction.paginationKey,
      instanceAction.entity[0],
      instanceAction.flattenPagination
    );
    return {
      fetch: () => {
        this.store.dispatch(instanceAction);
        cfEntityCatalog.route.api.getAllForApplication(appGuid, cfGuid);
      },
      monitors: {
        instanceMonitor,
        routeMonitor: cfEntityCatalog.route.store.getAllForApplication.getPaginationMonitor(appGuid, cfGuid)
      }
    };
  }
  /**
   * Returns an observable that emits a if the application fetch has finished or not.
   * Redirects to the app wall if we encounter an error when fetching the application.
   */
  private finishedFetchingApplication() {
    return this.appMonitor.entityRequest$.pipe(
      tap(entityRequestInfo => {
        if (entityRequestInfo.error) {
          this.redirectToAppWall();
        }
      }),
      pairwise(),
      map(([oldEntityRequestInfo, entityRequestInfo]) => {
        return !entityRequestInfo.error && (oldEntityRequestInfo.fetching && !entityRequestInfo.fetching);
      })
    );
  }

  public setSelectedServiceInstances(selected: APIResource<IServiceBinding>[]) {
    this.selectedServiceInstances = selected;
    const selectedServices = selected.reduce((res, binding) => {
      if (isUserProvidedServiceInstance(binding.entity.service_instance.entity)) {
        res.upsi.push(binding);
      } else {
        res.si.push(binding);
      }
      return res;
    }, { si: [], upsi: [] });
    this.selectedServiceInstances$.next(selectedServices.si);
    this.selectedUserServiceInstances$.next(selectedServices.upsi);
  }

  public setSelectedRoutes(selected: APIResource<IRoute>[]) {
    this.selectedRoutes = selected;
    this.selectedRoutes$.next(selected);
  }

  public getId(element: APIResource) {
    return element.metadata.guid;
  }

  public getInstanceId(service: APIResource<IServiceBinding>) {
    return service.entity.service_instance_guid;
  }

  /**
   * Starts the deletion or the application and related entities.
   * It ensures that the application is deleted before attempting to delete the other entities.
   */
  public startDelete = () => {
    if (this.deleteStarted) {
      return this.redirectToAppWall();
    }
    this.deleteStarted = true;
    return cfEntityCatalog.application.api.remove<RequestInfoState>(this.applicationService.appGuid, this.applicationService.cfGuid).pipe(
      filter(request => !request.deleting.busy && (request.deleting.deleted || request.deleting.error)),
      map((request) => ({ success: request.deleting.deleted })),
      tap(({ success }) => {
        if (success) {
          if (this.selectedRoutes && this.selectedRoutes.length) {
            this.selectedRoutes.forEach(route => {
              cfEntityCatalog.route.api.delete(route.metadata.guid, this.applicationService.cfGuid, this.applicationService.appGuid);
            });
          }
          if (this.selectedServiceInstances && this.selectedServiceInstances.length) {
            this.selectedServiceInstances.forEach(instance => {
              if (isUserProvidedServiceInstance(instance.entity.service_instance.entity)) {
                cfEntityCatalog.userProvidedService.api.remove(instance.entity.service_instance_guid, this.applicationService.cfGuid);
              } else {
                cfEntityCatalog.serviceInstance.api.remove(instance.entity.service_instance_guid, this.applicationService.cfGuid);
              }
            });
          }
        }
      })
    );
  };
}
