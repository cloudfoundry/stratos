import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { filter, first, map, startWith, switchMap, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IServiceBinding } from '../../../core/cf-api-svc.types';
import { IApp, IRoute } from '../../../core/cf-api.types';
import {
  AppServiceBindingDataSource,
} from '../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-data-source';
import { CfAppsDataSource, createGetAllAppAction } from '../../../shared/components/list/list-types/app/cf-apps-data-source';
import { EntityMonitor } from '../../../shared/monitors/entity-monitor';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetAppRoutes } from '../../../store/actions/application-service-routes.actions';
import { GetAllApplications } from '../../../store/actions/application.actions';
import { RouterNav } from '../../../store/actions/router.actions';
import { AppState } from '../../../store/app-state';
import {
  applicationSchemaKey,
  entityFactory,
  serviceBindingSchemaKey,
  serviceInstancesSchemaKey,
  routeSchemaKey,
} from '../../../store/helpers/entity-factory';
import { createEntityRelationKey, createEntityRelationPaginationKey } from '../../../store/helpers/entity-relations.types';
import { APIResource } from '../../../store/types/api.types';
import { AppInstanceStats } from '../../../store/types/app-metadata.types';
import { CloudFoundrySpaceService } from '../../cloud-foundry/services/cloud-foundry-space.service';
import { ApplicationService } from '../application.service';
import { AppMonitorComponentTypes } from '../../../shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import { Subject } from 'rxjs/Subject';
import { DeleteRoute } from '../../../store/actions/route.actions';
import { ITableColumn } from '../../../shared/components/list/list-table/table.types';

@Component({
  selector: 'app-application-delete',
  templateUrl: './application-delete.component.html',
  styleUrls: ['./application-delete.component.scss'],
  providers: [
    CloudFoundrySpaceService
  ]
})
export class ApplicationDeleteComponent<T> implements OnDestroy {

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
  public selectedRoutes$ = new Subject<APIResource<IRoute>[]>();
  public selectedServiceInstances$ = new Subject<APIResource<IServiceBinding>[]>();
  private redirectAfterDeleteSub: Subscription;
  private appWallFetchAction: GetAllApplications;
  public routes: APIResource<IRoute>[];
  public instances: AppInstanceStats[];
  public deleting$: Observable<boolean>;

  public serviceInstancesSchemaKey = serviceInstancesSchemaKey;
  public routeSchemaKey = routeSchemaKey;
  public appSchemaKey = applicationSchemaKey;
  public deletingState = AppMonitorComponentTypes.DELETE;

  constructor(
    private store: Store<AppState>,
    private applicationService: ApplicationService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private entityMonitorFactory: EntityMonitorFactory
  ) {
    const appMonitor = this.getApplicationMonitor();
    this.selectedApplication$ = applicationService.app$.pipe(
      map(entityInfo => [entityInfo.entity])
    );
    this.redirectAfterDeleteSub = this.getRedirectSub(appMonitor);

    const [instanceMonitor, routeMonitor] = this.fetchRelatedEntities();

    this.fetchingRelated$ = combineLatest(instanceMonitor.fetchingCurrentPage$, routeMonitor.fetchingCurrentPage$).pipe(
      map(([fetchingInstances, fetchingRoutes]) => fetchingInstances || fetchingRoutes),
      filter(fetching => !fetching),
      first(),
      startWith(true)
    );

    this.deleting$ = this.isDeleting(this.fetchingRelated$);

    this.fetchingRelated$.pipe(
      switchMap(() => combineLatest(
        instanceMonitor.currentPage$,
        routeMonitor.currentPage$
      ))
    )
      .subscribe(([instances, routes]) => {
        this.routes = routes;
        this.instances = instances;
      });
    // this.store.dispatch(new DeleteApplication(this.applicationService.appGuid, this.applicationService.cfGuid));
  }

  ngOnDestroy() {
    this.redirectAfterDeleteSub.unsubscribe();
  }

  public redirectToAppWall() {
    this.store.dispatch(this.appWallFetchAction);
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

  private isDeleting(fetchingRelated$: Observable<boolean>) {
    return combineLatest(fetchingRelated$, this.applicationService.isDeletingApp$).pipe(
      map(([fetchingRelated, deletingApp]) => fetchingRelated || deletingApp)
    );
  }
  private getRedirectSub(appMonitor: EntityMonitor<APIResource<IApp>>) {
    return appMonitor.entityRequest$.pipe(
      filter(entityRequestInfo => entityRequestInfo.deleting.deleted),
      first(),
      tap(entityRequestInfo => {
        this.dispatchAppWallFetch();
        if (!Array.isArray(this.routes) || !this.routes.length) {
          this.redirectToAppWall();
        }
      })
    ).subscribe();
  }
  private dispatchAppWallFetch() {
    this.store.dispatch(createGetAllAppAction(CfAppsDataSource.paginationKey));
  }

  private setSelectedServiceInstances(selected: APIResource<IServiceBinding>[]) {
    console.log('service', selected);
    this.selectedServiceInstances = selected;
    this.selectedServiceInstances$.next(selected);
  }

  private setSelectedRoutes(selected: APIResource<IRoute>[]) {
    console.log('routes', selected);
    this.selectedRoutes = selected;
    this.selectedRoutes$.next(selected);
  }

  public getId(element: APIResource) {
    return element.metadata.guid;
  }

  public startDelete() {
    if (this.selectedRoutes && this.selectedRoutes.length) {
      this.selectedRoutes.forEach(route => {
        this.store.dispatch(new DeleteRoute(route.metadata.guid, this.applicationService.cfGuid));
      });
    }
  }
}
