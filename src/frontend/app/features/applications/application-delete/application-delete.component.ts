import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { filter, first, map, startWith, switchMap, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IApp, IRoute } from '../../../core/cf-api.types';
import { CfAppsDataSource, createGetAllAppAction } from '../../../shared/components/list/list-types/app/cf-apps-data-source';
import { EntityMonitor } from '../../../shared/monitors/entity-monitor';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetAppStatsAction } from '../../../store/actions/app-metadata.actions';
import { GetAppRoutes, GetAppServiceBindings } from '../../../store/actions/application-service-routes.actions';
import { DeleteApplication, GetAllApplications } from '../../../store/actions/application.actions';
import { getPaginationKey } from '../../../store/actions/pagination.actions';
import { RouterNav } from '../../../store/actions/router.actions';
import { AppState } from '../../../store/app-state';
import { applicationSchemaKey, appStatsSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../store/helpers/entity-relations.types';
import { APIResource } from '../../../store/types/api.types';
import { PaginatedAction } from '../../../store/types/pagination.types';
import { ApplicationService } from '../application.service';
import { AppInstanceStats } from '../../../store/types/app-metadata.types';

@Component({
  selector: 'app-application-delete',
  templateUrl: './application-delete.component.html',
  styleUrls: ['./application-delete.component.scss']
})
export class ApplicationDeleteComponent implements OnDestroy {


  private redirectAfterDeleteSub: Subscription;
  private appWallFetchAction: GetAllApplications;
  public routes: APIResource<IRoute>[];
  public instances: AppInstanceStats[];
  public deleting$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private applicationService: ApplicationService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private entityMonitorFactory: EntityMonitorFactory
  ) {

    const appMonitor = this.getApplicationMonitor();
    this.redirectAfterDeleteSub = this.getRedirectSub(appMonitor);

    const [instanceMonitor, routeMonitor] = this.fetchRelatedEntities();

    const fetchingRelated$ = combineLatest(instanceMonitor.fetchingCurrentPage$, routeMonitor.fetchingCurrentPage$).pipe(
      map(([fetchingInstances, fetchingRoutes]) => fetchingInstances || fetchingRoutes),
      startWith(true)
    );

    this.deleting$ = this.isDeleting(fetchingRelated$);

    fetchingRelated$.pipe(
      filter(fetching => !fetching),
      first(),
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
    const { appGuid, cfGuid } = this.applicationService;
    const instanceAction = new GetAppServiceBindings(
      appGuid,
      cfGuid
    );
    const routesAction = this.makeActionLocal(new GetAppRoutes(
      appGuid,
      cfGuid,
      createEntityRelationPaginationKey(applicationSchemaKey, appGuid)
    ));
    const instancePaginationKey = instanceAction.paginationKey;
    const routesPaginationKey = routesAction.paginationKey;
    this.store.dispatch(instanceAction);
    this.store.dispatch(routesAction);
    const instanceMonitor = this.paginationMonitorFactory.create<AppInstanceStats>(instancePaginationKey, instanceAction.entity[0]);
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
    this.store.dispatch(createGetAllAppAction(CfAppsDataSource.paginationKey))
  }
  private makeActionLocal(action: PaginatedAction) {
    action.flattenPagination = true;
    action.initialParams['results-per-page'] = 100;
    return action;
  }
}
