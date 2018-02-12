import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, mergeMap } from 'rxjs/operators';

import { EntityService } from '../../core/entity-service';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import {
  ApplicationStateData,
  ApplicationStateService,
} from '../../shared/components/application-state/application-state.service';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import {
  AppMetadataTypes,
  GetAppEnvVarsAction,
  GetAppStatsAction,
  GetAppSummaryAction,
} from '../../store/actions/app-metadata.actions';
import { GetApplication, UpdateApplication, UpdateExistingApplication } from '../../store/actions/application.actions';
import { ApplicationSchema } from '../../store/actions/application.actions';
import { AppState } from '../../store/app-state';
import { ActionState } from '../../store/reducers/api-request-reducer/types';
import { selectEntity } from '../../store/selectors/api.selectors';
import { selectUpdateInfo } from '../../store/selectors/api.selectors';
import { endpointEntitiesSelector } from '../../store/selectors/endpoint.selectors';
import { APIResource, EntityInfo } from '../../store/types/api.types';
import {
  AppEnvVarSchema,
  AppStat,
  AppStatSchema,
  AppStatsSchema,
  AppSummary,
  AppSummarySchema,
} from '../../store/types/app-metadata.types';
import { PaginationEntityState } from '../../store/types/pagination.types';
import {
  getCurrentPageRequestInfo,
  getPaginationObservables,

  PaginationObservables,
} from './../../store/reducers/pagination-reducer/pagination-reducer.helper';
import {
  ApplicationEnvVarsService,
  EnvVarStratosProject,
} from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { getRoute, isTCPRoute } from './routes/routes.helper';
import { PaginationMonitor } from '../../shared/monitors/pagination-monitor';
import { spaceSchemaKey, organisationSchemaKey } from '../../store/actions/action-types';

export interface ApplicationData {
  fetching: boolean;
  app: EntityInfo;
  stack: EntityInfo;
  cf: any;
  appUrl: string;
}

@Injectable()
export class ApplicationService {
  applicationInstanceState$: Observable<any>;

  private appEntityService: EntityService;
  private appSummaryEntityService: EntityService;

  constructor(
    public cfGuid: string,
    public appGuid: string,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private appStateService: ApplicationStateService,
    private appEnvVarsService: ApplicationEnvVarsService,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {

    this.appEntityService = this.entityServiceFactory.create(
      ApplicationSchema.key,
      ApplicationSchema,
      appGuid,
      new GetApplication(appGuid, cfGuid));

    this.appSummaryEntityService = this.entityServiceFactory.create(
      AppSummarySchema.key,
      AppSummarySchema,
      appGuid,
      new GetAppSummaryAction(appGuid, cfGuid));

    this.constructCoreObservables();
    this.constructAmalgamatedObservables();
    this.constructStatusObservables();
  }

  // NJ: This needs to be cleaned up. So much going on!
  isFetchingApp$: Observable<boolean>;
  isUpdatingApp$: Observable<boolean>;

  isDeletingApp$: Observable<boolean>;

  isFetchingEnvVars$: Observable<boolean>;
  isUpdatingEnvVars$: Observable<boolean>;
  isFetchingStats$: Observable<boolean>;

  app$: Observable<EntityInfo>;
  waitForAppEntity$: Observable<EntityInfo>;
  appSummary$: Observable<EntityInfo<AppSummary>>;
  appStats$: Observable<APIResource<AppStat>[]>;
  private appStatsFetching$: Observable<PaginationEntityState>; // Use isFetchingStats$ which is properly gated
  appEnvVars: PaginationObservables<APIResource>;
  appOrg$: Observable<APIResource<any>>;
  appSpace$: Observable<APIResource<any>>;

  application$: Observable<ApplicationData>;
  applicationStratProject$: Observable<EnvVarStratosProject>;
  applicationState$: Observable<ApplicationStateData>;

  /**
   * Fetch the current state of the app (given it's instances) as an object ready
   *
   * @static
   * @param {Store<AppState>} store
   * @param {ApplicationStateService} appStateService
   * @param {any} app
   * @param {string} appGuid
   * @param {string} cfGuid
   * @returns {Observable<ApplicationStateData>}
   * @memberof ApplicationService
   */
  static getApplicationState(
    store: Store<AppState>,
    appStateService: ApplicationStateService,
    app,
    appGuid: string,
    cfGuid: string): Observable<ApplicationStateData> {
    const dummyAction = new GetAppStatsAction(appGuid, cfGuid);
    const paginationMonitor = new PaginationMonitor(
      store,
      dummyAction.paginationKey,
      AppStatSchema
    );
    return paginationMonitor.currentPage$.pipe(
      map(appInstancesPages => {
        const appInstances = [].concat.apply([], Object.values(appInstancesPages))
          .filter(apiResource => !!apiResource)
          .map(apiResource => {
            return apiResource.entity;
          });
        return appStateService.get(app, appInstances);
      })
    ).shareReplay(1);
  }

  private constructCoreObservables() {
    // First set up all the base observables
    this.app$ = this.appEntityService.waitForEntity$;

    // App org and space
    this.app$
      .filter(entityInfo => entityInfo.entity && entityInfo.entity.entity && entityInfo.entity.entity.cfGuid)
      .map(entityInfo => entityInfo.entity.entity)
      .do(app => {
        this.appSpace$ = this.store.select(selectEntity(spaceSchemaKey, app.space_guid));
        this.appOrg$ = this.appSpace$.pipe(
          map(space => space.entity.organization_guid),
          mergeMap(orgGuid => {
            return this.store.select(selectEntity(organisationSchemaKey, orgGuid));
          })
        );
      })
      .take(1)
      .subscribe();

    this.isDeletingApp$ = this.appEntityService.isDeletingEntity$.shareReplay(1);

    this.waitForAppEntity$ = this.appEntityService.waitForEntity$.shareReplay(1);

    this.appSummary$ = this.waitForAppEntity$.switchMap(() => this.appSummaryEntityService.entityObs$).shareReplay(1);
    const action = new GetAppEnvVarsAction(this.appGuid, this.cfGuid);
    this.appEnvVars = getPaginationObservables<APIResource>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        AppEnvVarSchema
      )
    }, true);
  }

  private constructAmalgamatedObservables() {
    // Assign/Amalgamate them to public properties (with mangling if required)
    const action = new GetAppStatsAction(this.appGuid, this.cfGuid);
    const appStats = getPaginationObservables<APIResource<AppStat>>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        AppStatSchema
      )
    }, true);

    this.appStats$ = this.waitForAppEntity$
      .filter(ai => ai && ai.entity && ai.entity.entity)
      .switchMap(ai => {
        if (ai.entity.entity.state === 'STARTED') {
          return appStats.entities$;
        } else {
          return Observable.of(new Array<APIResource<AppStat>>());
        }
      });

    this.appStatsFetching$ = this.waitForAppEntity$
      .filter(ai => ai && ai.entity && ai.entity.entity && ai.entity.entity.state === 'STARTED')
      .switchMap(ai => {
        return appStats.pagination$;
      }).shareReplay(1);

    this.application$ = this.waitForAppEntity$
      .combineLatest(
      this.store.select(endpointEntitiesSelector),
    )
      .filter(([{ entity, entityRequestInfo }, endpoints]: [EntityInfo, any]) => {
        return entity && entity.entity && entity.entity.cfGuid;
      })
      .map(([{ entity, entityRequestInfo }, endpoints]: [EntityInfo, any]): ApplicationData => {
        return {
          fetching: entityRequestInfo.fetching,
          app: entity,
          stack: entity.entity.stack,
          cf: endpoints[entity.entity.cfGuid],
          appUrl: this.getAppUrl(entity)
        };
      }).shareReplay(1);

    this.applicationState$ = this.waitForAppEntity$
      .withLatestFrom(this.appStats$)
      .map(([appInfo, appStatsArray]: [EntityInfo, APIResource<AppStat>[]]) => {
        return this.appStateService.get(appInfo.entity.entity, appStatsArray.map(apiResource => apiResource.entity));
      }).shareReplay(1);

    this.applicationInstanceState$ = this.waitForAppEntity$
      .withLatestFrom(this.appStats$)
      .switchMap(([appInfo, appStatsArray]: [EntityInfo, APIResource<AppStat>[]]) => {
        return ApplicationService.getApplicationState(this.store, this.appStateService, appInfo.entity.entity, this.appGuid, this.cfGuid);
      }).shareReplay(1);

    this.applicationStratProject$ = this.appEnvVars.entities$.map(applicationEnvVars => {
      return this.appEnvVarsService.FetchStratosProject(applicationEnvVars[0].entity);
    }).shareReplay(1);
  }

  private constructStatusObservables() {
    /**
     * An observable based on the core application entity
    */
    this.isFetchingApp$ = Observable.combineLatest(
      this.app$.map(ei => ei.entityRequestInfo.fetching),
      this.appSummary$.map(as => as.entityRequestInfo.fetching)
    )
      .map((fetching) => fetching[0] || fetching[1]).shareReplay(1);

    this.isUpdatingApp$ =
      this.app$.map(a => {
        const updatingSection = a.entityRequestInfo.updating[UpdateExistingApplication.updateKey] || {
          busy: false
        };
        return updatingSection.busy || false;
      });

    this.isFetchingEnvVars$ = this.appEnvVars.pagination$.map(ev => getCurrentPageRequestInfo(ev).busy).startWith(false).shareReplay(1);

    this.isUpdatingEnvVars$ = this.appEnvVars.pagination$.map(
      ev => getCurrentPageRequestInfo(ev).busy && ev.ids[ev.currentPage]
    ).startWith(false).shareReplay(1);

    this.isFetchingStats$ = this.appStatsFetching$.map(
      appStats => appStats ? getCurrentPageRequestInfo(appStats).busy : false
    ).startWith(false).shareReplay(1);
  }

  getAppUrl(app: EntityInfo): string {
    if (!app.entity.routes) {
      return null;
    }
    const nonTCPRoutes = app.entity.routes.filter(p => !isTCPRoute(p));
    if (nonTCPRoutes.length > 0) {
      return getRoute(
        nonTCPRoutes[0],
        true,
        false,
        nonTCPRoutes[0].entity.domain
      );
    }
    return null;
  }

  isEntityComplete(value, requestInfo: { fetching: boolean }): boolean {
    if (requestInfo) {
      return !requestInfo.fetching;
    } else {
      return !!value;
    }
  }

  /*
  * Update an application
  */
  updateApplication(updatedApplication: UpdateApplication, updateEntities?: AppMetadataTypes[]): Observable<ActionState> {
    this.store.dispatch(new UpdateExistingApplication(
      this.appGuid,
      this.cfGuid,
      { ...updatedApplication },
      updateEntities
    ));

    // Create an Observable that can be used to determine when the update completed
    const actionState = selectUpdateInfo(ApplicationSchema.key,
      this.appGuid,
      UpdateExistingApplication.updateKey);
    return this.store.select(actionState).filter(item => !item.busy);
  }
}
