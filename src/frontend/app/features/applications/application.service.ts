import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map, switchMap } from 'rxjs/operators';

import { IApp, IOrganization, ISpace } from '../../core/cf-api.types';
import { EntityService } from '../../core/entity-service';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import {
  ApplicationStateData,
  ApplicationStateService,
} from '../../shared/components/application-state/application-state.service';
import { PaginationMonitor } from '../../shared/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import {
  AppMetadataTypes,
  GetAppEnvVarsAction,
  GetAppStatsAction,
  GetAppSummaryAction,
} from '../../store/actions/app-metadata.actions';
import { GetApplication, UpdateApplication, UpdateExistingApplication } from '../../store/actions/application.actions';
import { AppState } from '../../store/app-state';
import {
  appEnvVarsSchemaKey,
  applicationSchemaKey,
  appStatsSchemaKey,
  appSummarySchemaKey,
  domainSchemaKey,
  entityFactory,
  organizationSchemaKey,
  routeSchemaKey,
  serviceBindingSchemaKey,
  spaceSchemaKey,
  stackSchemaKey,
} from '../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../store/helpers/entity-relations.types';
import { ActionState, rootUpdatingKey } from '../../store/reducers/api-request-reducer/types';
import { selectEntity, selectUpdateInfo } from '../../store/selectors/api.selectors';
import { endpointEntitiesSelector } from '../../store/selectors/endpoint.selectors';
import { APIResource, EntityInfo } from '../../store/types/api.types';
import { AppStat, AppSummary } from '../../store/types/app-metadata.types';
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

export function createGetApplicationAction(guid: string, endpointGuid: string) {
  return new GetApplication(
    guid,
    endpointGuid, [
      createEntityRelationKey(applicationSchemaKey, routeSchemaKey),
      createEntityRelationKey(applicationSchemaKey, spaceSchemaKey),
      createEntityRelationKey(applicationSchemaKey, stackSchemaKey),
      createEntityRelationKey(applicationSchemaKey, serviceBindingSchemaKey),
      createEntityRelationKey(routeSchemaKey, domainSchemaKey),
      createEntityRelationKey(spaceSchemaKey, organizationSchemaKey),
    ]
  );
}

export interface ApplicationData {
  fetching: boolean;
  app: EntityInfo;
  stack: EntityInfo;
  cf: any;
}

@Injectable()
export class ApplicationService {

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

    this.appEntityService = this.entityServiceFactory.create<APIResource<IApp>>(
      applicationSchemaKey,
      entityFactory(applicationSchemaKey),
      appGuid,
      createGetApplicationAction(appGuid, cfGuid)
    );

    this.appSummaryEntityService = this.entityServiceFactory.create(
      appSummarySchemaKey,
      entityFactory(appSummarySchemaKey),
      appGuid,
      new GetAppSummaryAction(appGuid, cfGuid),
      false
    );

    this.constructCoreObservables();
    this.constructAmalgamatedObservables();
    this.constructStatusObservables();
  }

  // NJ: This needs to be cleaned up. So much going on!
  /**
   * An observable based on the core application entity
   */
  isFetchingApp$: Observable<boolean>;
  isUpdatingApp$: Observable<boolean>;

  isDeletingApp$: Observable<boolean>;

  isFetchingEnvVars$: Observable<boolean>;
  isUpdatingEnvVars$: Observable<boolean>;
  isFetchingStats$: Observable<boolean>;

  app$: Observable<EntityInfo<APIResource<IApp>>>;
  waitForAppEntity$: Observable<EntityInfo<APIResource<IApp>>>;
  appSummary$: Observable<EntityInfo<AppSummary>>;
  appStats$: Observable<APIResource<AppStat>[]>;
  private appStatsFetching$: Observable<PaginationEntityState>; // Use isFetchingStats$ which is properly gated
  appEnvVars: PaginationObservables<APIResource>;
  appOrg$: Observable<APIResource<IOrganization>>;
  appSpace$: Observable<APIResource<ISpace>>;

  application$: Observable<ApplicationData>;
  applicationStratProject$: Observable<EnvVarStratosProject>;
  applicationState$: Observable<ApplicationStateData>;
  applicationUrl$: Observable<string>;

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
    app: APIResource<IApp>,
    appGuid: string,
    cfGuid: string): Observable<ApplicationStateData> {
    const dummyAction = new GetAppStatsAction(appGuid, cfGuid);
    const paginationMonitor = new PaginationMonitor(
      store,
      dummyAction.paginationKey,
      entityFactory(appStatsSchemaKey)
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
    ).publishReplay(1).refCount();
  }

  private constructCoreObservables() {
    // First set up all the base observables
    this.app$ = this.appEntityService.waitForEntity$;
    const moreWaiting$ = this.app$
      .filter(entityInfo => !!(entityInfo.entity && entityInfo.entity.entity && entityInfo.entity.entity.cfGuid))
      .map(entityInfo => entityInfo.entity.entity);
    this.appSpace$ = moreWaiting$
      .first()
      .switchMap(app => this.store.select(selectEntity(spaceSchemaKey, app.space_guid)));
    this.appOrg$ = moreWaiting$
      .first()
      .switchMap(app => this.appSpace$.pipe(
        map(space => space.entity.organization_guid),
        switchMap(orgGuid => {
          return this.store.select(selectEntity(organizationSchemaKey, orgGuid));
        })
      ));

    this.isDeletingApp$ = this.appEntityService.isDeletingEntity$.publishReplay(1).refCount();

    this.waitForAppEntity$ = this.appEntityService.waitForEntity$.publishReplay(1).refCount();

    this.appSummary$ = this.waitForAppEntity$.switchMap(() => this.appSummaryEntityService.entityObs$).publishReplay(1).refCount();
    const action = new GetAppEnvVarsAction(this.appGuid, this.cfGuid);
    this.appEnvVars = getPaginationObservables<APIResource>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        entityFactory(appEnvVarsSchemaKey)
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
        entityFactory(appStatsSchemaKey)
      )
    }, true);
    // This will fail to fetch the app stats if the current app is not running but we're
    // willing to do this to speed up the initial fetch for a running application.
    this.appStats$ = appStats.entities$;

    this.appStatsFetching$ = appStats.pagination$.publishReplay(1).refCount();

    this.application$ = this.waitForAppEntity$
      .combineLatest(this.store.select(endpointEntitiesSelector))
      .filter(([{ entity, entityRequestInfo }, endpoints]: [EntityInfo, any]) => {
        return entity && entity.entity && entity.entity.cfGuid;
      })
      .map(([{ entity, entityRequestInfo }, endpoints]: [EntityInfo, any]): ApplicationData => {
        return {
          fetching: entityRequestInfo.fetching,
          app: entity,
          stack: entity.entity.stack,
          cf: endpoints[entity.entity.cfGuid],
        };
      }).publishReplay(1).refCount();

    this.applicationState$ = this.waitForAppEntity$
      .combineLatest(this.appStats$.startWith(null))
      .map(([appInfo, appStatsArray]: [EntityInfo, APIResource<AppStat>[]]) => {
        return this.appStateService.get(appInfo.entity.entity, appStatsArray ? appStatsArray.map(apiResource => apiResource.entity) : null);
      }).publishReplay(1).refCount();

    this.applicationStratProject$ = this.appEnvVars.entities$.map(applicationEnvVars => {
      return this.appEnvVarsService.FetchStratosProject(applicationEnvVars[0].entity);
    }).publishReplay(1).refCount();

  }

  private constructStatusObservables() {
    this.isFetchingApp$ = this.appEntityService.isFetchingEntity$;

    this.isUpdatingApp$ = this.appEntityService.entityObs$.map(a => {
      const updatingRoot = a.entityRequestInfo.updating[rootUpdatingKey] || { busy: false };
      const updatingSection = a.entityRequestInfo.updating[UpdateExistingApplication.updateKey] || { busy: false };
      return !!updatingRoot.busy || !!updatingSection.busy;
    });

    this.isFetchingEnvVars$ = this.appEnvVars.pagination$
      .map(ev => getCurrentPageRequestInfo(ev).busy)
      .startWith(false)
      .publishReplay(1)
      .refCount();

    this.isUpdatingEnvVars$ = this.appEnvVars.pagination$.map(
      ev => getCurrentPageRequestInfo(ev).busy && ev.ids[ev.currentPage]
    ).startWith(false).publishReplay(1).refCount();

    this.isFetchingStats$ = this.appStatsFetching$.map(
      appStats => appStats ? getCurrentPageRequestInfo(appStats).busy : false
    ).startWith(false).publishReplay(1).refCount();

    this.applicationUrl$ = this.app$.pipe(
      map(({ entity }) => entity),
      map(app => {
        const routes = app && app.entity.routes ? app.entity.routes : [];
        const nonTCPRoutes = routes.filter(p => p && !isTCPRoute(p));
        if (nonTCPRoutes.length > 0) {
          return nonTCPRoutes[0];
        }
        return null;
      }),
      switchMap(route => {
        if (!route) {
          return Observable.of(null);
        } else {
          // The route can async update itself to contain the required domain... so we need to watch it for it's normalized content
          return this.entityServiceFactory.create<APIResource>(
            routeSchemaKey,
            entityFactory(routeSchemaKey),
            route.metadata.guid,
            {
              type: '',
              entityKey: routeSchemaKey,
              entity: entityFactory(routeSchemaKey)
            },
            false)
            .entityObs$.pipe(
              map(entRoute => entRoute.entity),
              filter(entRoute => entRoute.entity.domain),
              map(entRoute => getRoute(entRoute, true, false, entRoute.entity.domain))
            );
        }
      })
    ).publishReplay(1).refCount();
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
  updateApplication(
    updatedApplication: UpdateApplication,
    updateEntities?: AppMetadataTypes[],
    existingApplication?: IApp): Observable<ActionState> {
    this.store.dispatch(new UpdateExistingApplication(
      this.appGuid,
      this.cfGuid,
      { ...updatedApplication },
      existingApplication,
      updateEntities
    ));

    // Create an Observable that can be used to determine when the update completed
    const actionState = selectUpdateInfo(applicationSchemaKey,
      this.appGuid,
      UpdateExistingApplication.updateKey);
    return this.store.select(actionState).filter(item => !item.busy);
  }
}
