import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { first, map, tap, takeUntil, takeWhile, pairwise, filter } from 'rxjs/operators';

import { IRoute } from '../../../core/cf-api.types';
import { CfAppsDataSource, createGetAllAppAction } from '../../../shared/components/list/list-types/app/cf-apps-data-source';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { DeleteApplication, GetAllApplications } from '../../../store/actions/application.actions';
import { AppState } from '../../../store/app-state';
import { applicationSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { APIResource } from '../../../store/types/api.types';
import { ApplicationService } from '../application.service';
import { RouterNav } from '../../../store/actions/router.actions';
import { Subscription } from 'rxjs/Subscription';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';

@Component({
  selector: 'app-application-delete',
  templateUrl: './application-delete.component.html',
  styleUrls: ['./application-delete.component.scss']
})
export class ApplicationDeleteComponent implements OnDestroy {

  private redirectAfterDeleteSub: Subscription;
  private appWallFetchAction: GetAllApplications;
  public routes: APIResource<IRoute>[];
  public deleting$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private applicationService: ApplicationService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private entityMonitorFactory: EntityMonitorFactory
  ) {
    this.appWallFetchAction = createGetAllAppAction(CfAppsDataSource.paginationKey);
    const appWallFetching$ = paginationMonitorFactory.create(
      CfAppsDataSource.paginationKey, entityFactory(applicationSchemaKey)
    ).fetchingCurrentPage$;
    const appMonitor = entityMonitorFactory.create(applicationService.appGuid, applicationSchemaKey, entityFactory(applicationSchemaKey));
    this.redirectAfterDeleteSub = appMonitor.entityRequest$.pipe(
      filter(entityRequestInfo => entityRequestInfo.deleting.deleted),
      first(),
      tap(entityRequestInfo => {
        if (!Array.isArray(this.routes) || !this.routes.length) {
          this.redirectToAppWall();
        }
      })
    ).subscribe();
    this.deleting$ = combineLatest(
      this.applicationService.isDeletingApp$,
      appWallFetching$
    ).pipe(
      map(([appDeleting, appWallFetching]) => appDeleting)
    );
    this.applicationService.app$.pipe(
      map(app => app.entity.entity.routes),
      first()
    ).subscribe(routes => {
      console.log(routes);
      this.routes = routes;
      this.store.dispatch(new DeleteApplication(this.applicationService.appGuid, this.applicationService.cfGuid));
    });
  }

  ngOnDestroy() {
    this.redirectAfterDeleteSub.unsubscribe();
  }

  public redirectToAppWall() {
    this.store.dispatch(this.appWallFetchAction);
    this.store.dispatch(new RouterNav({ path: '/applications' }));
  }
}
