import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { filter, first, map, startWith, switchMap, tap, delay, takeWhile } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subscription } from 'rxjs/Subscription';

import { IServiceBinding } from '../../../core/cf-api-svc.types';
import { IApp, IRoute } from '../../../core/cf-api.types';
import {
  AppMonitorComponentTypes,
} from '../../../shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import { ITableColumn } from '../../../shared/components/list/list-table/table.types';
import {
  AppServiceBindingDataSource,
} from '../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-data-source';
import { CfAppsDataSource, createGetAllAppAction } from '../../../shared/components/list/list-types/app/cf-apps-data-source';
import { EntityMonitor } from '../../../shared/monitors/entity-monitor';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetAppRoutes } from '../../../store/actions/application-service-routes.actions';
import { GetAllApplications, DeleteApplication } from '../../../store/actions/application.actions';
import { DeleteRoute } from '../../../store/actions/route.actions';
import { RouterNav } from '../../../store/actions/router.actions';
import { AppState } from '../../../store/app-state';
import {
  applicationSchemaKey,
  entityFactory,
  routeSchemaKey,
  serviceBindingSchemaKey,
  serviceInstancesSchemaKey,
} from '../../../store/helpers/entity-factory';
import { createEntityRelationKey, createEntityRelationPaginationKey } from '../../../store/helpers/entity-relations.types';
import { APIResource } from '../../../store/types/api.types';
import { AppInstanceStats } from '../../../store/types/app-metadata.types';
import { CloudFoundrySpaceService } from '../../cloud-foundry/services/cloud-foundry-space.service';
import { ApplicationService } from '../application.service';
import { CfAppRoutesListConfigService } from '../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import {
  AppServiceBindingListConfigService
} from '../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';
import { DeleteServiceInstance } from '../../../store/actions/service-instances.actions';
import { interval } from 'rxjs/observable/interval';
import { appReducers } from '../../../store/reducers.module';

@Component({
  selector: 'app-application-delete',
  templateUrl: './application-delete.component.html',
  styleUrls: ['./application-delete.component.scss'],
  providers: [
    CfAppRoutesListConfigService,
    AppServiceBindingListConfigService,
    CloudFoundrySpaceService
  ]
})
export class ApplicationDeleteComponent<T> {
  public deleteStarted = false;
  public instanceDeleteColumns: ITableColumn<APIResource<IServiceBinding>>[] = [
    {
      headerCell: () => 'Name',
      columnId: 'name',
      cellDefinition: {
        getValue: row => row.entity.service_instance.entity.name
      }
    }
  ];
  public routeDeleteColumns: ITableColumn<APIResource<IRoute>>[] = [
    {
      headerCell: () => 'Host',
      columnId: 'host',
      cellDefinition: {
        getValue: row => row.entity.host
      }
    }
  ];
  public appDeleteColumns: ITableColumn<APIResource<IApp>>[] = [
    {
      headerCell: () => 'Name',
      columnId: 'name',
      cellDefinition: {
        getValue: row => row.entity.name
      }
    }
  ];

  public selectedRoutes: APIResource<IRoute>[];
  public selectedServiceInstances: APIResource<IServiceBinding>[];
  public fetchingRelated$: Observable<boolean>;
  public selectedApplication$: Observable<APIResource<IApp>[]>;
  public selectedRoutes$ = new ReplaySubject<APIResource<IRoute>[]>(1);
  public selectedServiceInstances$ = new ReplaySubject<APIResource<IServiceBinding>[]>(1);
  private appWallFetchAction: GetAllApplications;
  public routes: APIResource<IRoute>[];
  public instances: AppInstanceStats[];
  public fetchingApplication$: Observable<boolean>;

  public serviceInstancesSchemaKey = serviceInstancesSchemaKey;
  public routeSchemaKey = routeSchemaKey;
  public applicationSchemaKey = applicationSchemaKey;
  public deletingState = AppMonitorComponentTypes.DELETE;

  public appMonitor: EntityMonitor<APIResource<IApp>>;

  public cancelUrl: string;

  constructor(
    private store: Store<AppState>,
    private applicationService: ApplicationService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private entityMonitorFactory: EntityMonitorFactory
  ) {
    this.appMonitor = this.getApplicationMonitor();
    this.selectedApplication$ = applicationService.app$.pipe(
      map(entityInfo => [entityInfo.entity])
    );
    this.cancelUrl = `/application/${applicationService.cfGuid}/${applicationService.appGuid}`;

    const [instanceMonitor, routeMonitor] = this.fetchRelatedEntities();

    this.fetchingRelated$ = combineLatest(instanceMonitor.fetchingCurrentPage$, routeMonitor.fetchingCurrentPage$).pipe(
      map(([fetchingInstances, fetchingRoutes]) => fetchingInstances || fetchingRoutes),
      filter(fetching => !fetching),
      first(),
      startWith(false)
    );

    this.fetchingApplication$ = this.isFetchingApplication(this.fetchingRelated$);

    this.fetchingRelated$.pipe(
      switchMap(() => combineLatest(
        instanceMonitor.currentPage$,
        routeMonitor.currentPage$
      )),
      first()
    )
      .subscribe(([instances, routes]) => {
        this.routes = routes;
        this.instances = instances;
      });
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
  public fetchRelatedEntities() {
    const serviceToInstanceRelationKey = createEntityRelationKey(serviceBindingSchemaKey, serviceInstancesSchemaKey);
    const { appGuid, cfGuid } = this.applicationService;
    const instanceAction = AppServiceBindingDataSource.createGetAllServiceBindings(appGuid, cfGuid);
    const routesAction = new GetAppRoutes(
      appGuid,
      cfGuid,
      createEntityRelationPaginationKey(applicationSchemaKey, appGuid)
    );
    const instancePaginationKey = instanceAction.paginationKey;
    const routesPaginationKey = routesAction.paginationKey;
    this.store.dispatch(instanceAction);
    this.store.dispatch(routesAction);
    const instanceMonitor = this.paginationMonitorFactory.create<APIResource<IServiceBinding>>(
      instancePaginationKey,
      instanceAction.entity[0]
    );
    const routesMonitor = this.paginationMonitorFactory.create<APIResource<IRoute>>(routesPaginationKey, routesAction.entity[0]);
    return [
      instanceMonitor,
      routesMonitor
    ];
  }

  private isFetchingApplication(fetchingRelated$: Observable<boolean>) {
    return combineLatest(this.appMonitor.entityRequest$, fetchingRelated$).pipe(
      tap(([appRequest]) => {
        if (appRequest.error) {
          this.redirectToAppWall();
        }
      }),
      takeWhile(([appRequest]) => !appRequest.error),
      map(([appRequest, fetchingRelated]) => appRequest.error || appRequest.fetching || fetchingRelated)
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
              this.store.dispatch(new DeleteRoute(route.metadata.guid, this.applicationService.cfGuid));
            });
          }
          if (this.selectedServiceInstances && this.selectedServiceInstances.length) {
            this.selectedServiceInstances.forEach(instance => {
              this.store.dispatch(new DeleteServiceInstance(this.applicationService.cfGuid, instance.metadata.guid));
            });
          }
        }
      }),

    );
  }
}
