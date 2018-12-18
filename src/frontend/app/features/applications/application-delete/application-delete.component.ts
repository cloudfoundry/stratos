import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, ReplaySubject } from 'rxjs';
import { filter, first, map, pairwise, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

import { IServiceBinding } from '../../../core/cf-api-svc.types';
import { IApp, IRoute } from '../../../core/cf-api.types';
import {
  AppMonitorComponentTypes,
} from '../../../shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import { DataFunctionDefinition } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { ITableColumn } from '../../../shared/components/list/list-table/table.types';
import {
  CfAppRoutesListConfigService,
} from '../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import {
  TableCellRouteComponent,
} from '../../../shared/components/list/list-types/cf-routes/table-cell-route/table-cell-route.component';
import {
  TableCellTCPRouteComponent,
} from '../../../shared/components/list/list-types/cf-routes/table-cell-tcproute/table-cell-tcproute.component';
import {
  AppServiceBindingDataSource,
} from '../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-data-source';
import {
  AppServiceBindingListConfigService,
} from '../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';
import {
  TableCellAppInstancesComponent,
} from '../../../shared/components/list/list-types/app/table-cell-app-instances/table-cell-app-instances.component';
import {
  TableCellAppStatusComponent,
} from '../../../shared/components/list/list-types/app/table-cell-app-status/table-cell-app-status.component';
import { EntityMonitor } from '../../../shared/monitors/entity-monitor';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { PaginationMonitor } from '../../../shared/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetAppRoutes } from '../../../store/actions/application-service-routes.actions';
import { DeleteApplication, GetApplication } from '../../../store/actions/application.actions';
import { DeleteRoute } from '../../../store/actions/route.actions';
import { RouterNav } from '../../../store/actions/router.actions';
import { DeleteServiceInstance } from '../../../store/actions/service-instances.actions';
import { AppState } from '../../../store/app-state';
import {
  applicationSchemaKey,
  entityFactory,
  routeSchemaKey,
  serviceInstancesSchemaKey,
} from '../../../store/helpers/entity-factory';
import { APIResource } from '../../../store/types/api.types';
import { ApplicationService } from '../application.service';


@Component({
  selector: 'app-application-delete',
  templateUrl: './application-delete.component.html',
  styleUrls: ['./application-delete.component.scss'],
  providers: [
    CfAppRoutesListConfigService,
    AppServiceBindingListConfigService
  ]
})
export class ApplicationDeleteComponent<T> {
  relatedEntities$: Observable<{ instances: APIResource<IServiceBinding>[], routes: APIResource<IRoute>[] }>;
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
        getValue: (row) => row.entity.service_instance.entity.service.entity.label
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
      } as DataFunctionDefinition,
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
        newTab: true,
      },
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

  public selectedRoutes: APIResource<IRoute>[];
  public selectedServiceInstances: APIResource<IServiceBinding>[];
  public fetchingRelated$: Observable<boolean>;
  public selectedApplication$: Observable<APIResource<IApp>[]>;
  public selectedRoutes$ = new ReplaySubject<APIResource<IRoute>[]>(1);
  public selectedServiceInstances$ = new ReplaySubject<APIResource<IServiceBinding>[]>(1);
  public fetchingApplicationData$: Observable<boolean>;

  public serviceInstancesSchemaKey = serviceInstancesSchemaKey;
  public routeSchemaKey = routeSchemaKey;
  public applicationSchemaKey = applicationSchemaKey;
  public deletingState = AppMonitorComponentTypes.DELETE;
  public routeMonitor: PaginationMonitor<APIResource<IRoute>>;
  public instanceMonitor: PaginationMonitor<APIResource<IServiceBinding>>;

  public appMonitor: EntityMonitor<APIResource<IApp>>;

  public cancelUrl: string;

  constructor(
    private store: Store<AppState>,
    private applicationService: ApplicationService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private entityMonitorFactory: EntityMonitorFactory,
    private datePipe: DatePipe
  ) {
    this.setupAppMonitor();
    this.cancelUrl = `/applications/${applicationService.cfGuid}/${applicationService.appGuid}`;
    const { fetch, monitors } = this.buildRelatedEntitiesActionMonitors();
    const { instanceMonitor, routeMonitor } = monitors;
    this.instanceMonitor = instanceMonitor;
    this.routeMonitor = routeMonitor;

    this.relatedEntities$ = combineLatest(instanceMonitor.currentPage$, routeMonitor.currentPage$).pipe(
      filter(([instances, routes]) => !!routes && !!instances),
      map(([instances, routes]) => ({ instances, routes }))
    );

    // Are we fetching application routes or service instances?
    this.fetchingRelated$ = combineLatest(instanceMonitor.fetchingCurrentPage$, routeMonitor.fetchingCurrentPage$).pipe(
      map(([fetchingInstances, fetchingRoutes]) => fetchingInstances || fetchingRoutes),
      startWith(true)
    );
    // Wait until we've finished fetching the application, fetch the related entities and monitor there progress.
    this.fetchingApplicationData$ = this.finishedFetchingApplication().pipe(
      filter(finished => finished),
      first(),
      tap(fetch),
      switchMap(() => this.fetchingRelated$),
      filter(fetching => !fetching),
      first(),
      shareReplay(1),
      startWith(true)
    );
    this.store.dispatch(new GetApplication(applicationService.appGuid, applicationService.cfGuid));
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
    return this.entityMonitorFactory.create<APIResource<IApp>>(
      this.applicationService.appGuid,
      applicationSchemaKey,
      entityFactory(applicationSchemaKey)
    );
  }
  /**
   * Builds the related entities actions and monitors to monitor the state of the entities.
   */
  public buildRelatedEntitiesActionMonitors() {
    const { appGuid, cfGuid } = this.applicationService;
    const instanceAction = AppServiceBindingDataSource.createGetAllServiceBindings(appGuid, cfGuid);
    const routesAction = new GetAppRoutes(appGuid, cfGuid);
    const instancePaginationKey = instanceAction.paginationKey;
    const routesPaginationKey = routesAction.paginationKey;

    const instanceMonitor = this.paginationMonitorFactory.create<APIResource<IServiceBinding>>(
      instancePaginationKey,
      instanceAction.entity[0]
    );
    const routeMonitor = this.paginationMonitorFactory.create<APIResource<IRoute>>(routesPaginationKey, routesAction.entity[0]);
    return {
      fetch: () => {
        this.store.dispatch(instanceAction);
        this.store.dispatch(routesAction);
      },
      monitors: {
        instanceMonitor,
        routeMonitor
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

  private setSelectedServiceInstances(selected: APIResource<IServiceBinding>[]) {
    this.selectedServiceInstances = selected;
    this.selectedServiceInstances$.next(selected);
  }

  private setSelectedRoutes(selected: APIResource<IRoute>[]) {
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
    this.store.dispatch(new DeleteApplication(this.applicationService.appGuid, this.applicationService.cfGuid));
    return this.appMonitor.entityRequest$.pipe(
      filter(request => !request.deleting.busy && (request.deleting.deleted || request.deleting.error)),
      map((request) => ({ success: request.deleting.deleted })),
      tap(({ success }) => {
        if (success) {
          if (this.selectedRoutes && this.selectedRoutes.length) {
            this.selectedRoutes.forEach(route => {
              this.store.dispatch(new DeleteRoute(route.metadata.guid, this.applicationService.cfGuid, this.applicationService.appGuid));
            });
          }
          if (this.selectedServiceInstances && this.selectedServiceInstances.length) {
            this.selectedServiceInstances.forEach(instance => {
              this.store.dispatch(new DeleteServiceInstance(this.applicationService.cfGuid, instance.entity.service_instance_guid));
            });
          }
        }
      })
    );
  }
}
