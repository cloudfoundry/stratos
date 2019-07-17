import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { combineLatest, filter, first, map, publishReplay, refCount, startWith, switchMap } from 'rxjs/operators';

import { CFEntityConfig } from '../../../../cloud-foundry/cf-types';
import {
  appEnvVarsEntityType,
  applicationEntityType,
  appStatsEntityType,
  domainEntityType,
  organizationEntityType,
  routeEntityType,
  serviceBindingEntityType,
  spaceEntityType,
  stackEntityType,
} from '../../../../cloud-foundry/src/cf-entity-factory';
import { selectCfEntity } from '../../../../cloud-foundry/src/selectors/api.selectors';
import {
  AppMetadataTypes,
  GetAppStatsAction,
  GetAppSummaryAction,
} from '../../../../cloud-foundry/src/actions/app-metadata.actions';
import {
  GetApplication,
  UpdateApplication,
  UpdateExistingApplication,
} from '../../../../cloud-foundry/src/actions/application.actions';
import { GetSpace } from '../../../../cloud-foundry/src/actions/space.actions';
import { CFAppState } from '../../../../store/src/app-state';
import { createEntityRelationKey } from '../../../../store/src/helpers/entity-relations/entity-relations.types';
import { ActionState, rootUpdatingKey } from '../../../../store/src/reducers/api-request-reducer/types';
import {
  getCurrentPageRequestInfo,
  getPaginationObservables,
  PaginationObservables,
} from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { selectUpdateInfo } from '../../../../store/src/selectors/api.selectors';
import { endpointEntitiesSelector } from '../../../../store/src/selectors/endpoint.selectors';
import { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { AppStat } from '../../../../store/src/types/app-metadata.types';
import { PaginationEntityState } from '../../../../store/src/types/pagination.types';
import { IApp, IAppSummary, IOrganization, ISpace } from '../../core/cf-api.types';
import { EntityService } from '../../core/entity-service';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import {
  ApplicationStateData,
  ApplicationStateService,
} from '../../shared/components/application-state/application-state.service';
import { APP_GUID, CF_GUID } from '../../shared/entity.tokens';
import { EntityMonitorFactory } from '../../shared/monitors/entity-monitor.factory.service';
import { PaginationMonitor } from '../../shared/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import {
  ApplicationEnvVarsHelper,
  EnvVarStratosProject,
} from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { getRoute, isTCPRoute } from './routes/routes.helper';



export function createGetApplicationAction(guid: string, endpointGuid: string) {
  return new GetApplication(
    guid,
    endpointGuid, [
      createEntityRelationKey(applicationEntityType, routeEntityType),
      createEntityRelationKey(applicationEntityType, spaceEntityType),
      createEntityRelationKey(applicationEntityType, stackEntityType),
      createEntityRelationKey(applicationEntityType, serviceBindingEntityType),
      createEntityRelationKey(routeEntityType, domainEntityType),
      createEntityRelationKey(spaceEntityType, organizationEntityType),
    ]
  );
}

export interface ApplicationData {
  fetching: boolean;
  app: EntityInfo<IApp>;
  stack: EntityInfo;
  cf: any;
}

@Injectable()
export class ApplicationService {

  private appEntityService: EntityService<APIResource<IApp>>;
  private appSummaryEntityService: EntityService<IAppSummary>;

  constructor(
    @Inject(CF_GUID) public cfGuid: string,
    @Inject(APP_GUID) public appGuid: string,
    private store: Store<CFAppState>,
    private entityServiceFactory: EntityServiceFactory,
    private appStateService: ApplicationStateService,
    private appEnvVarsService: ApplicationEnvVarsHelper,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {
    this.appEntityService = this.entityServiceFactory.create<APIResource<IApp>>(
      appGuid,
      createGetApplicationAction(appGuid, cfGuid)
    );
    this.appSummaryEntityService = this.entityServiceFactory.create<IAppSummary>(
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
  appSummary$: Observable<EntityInfo<IAppSummary>>;
  appStats$: Observable<APIResource<AppStat>[]>;
  private appStatsFetching$: Observable<PaginationEntityState>; // Use isFetchingStats$ which is properly gated
  appEnvVars: PaginationObservables<APIResource>;
  appOrg$: Observable<APIResource<IOrganization>>;
  appSpace$: Observable<APIResource<ISpace>>;

  application$: Observable<ApplicationData>;
  applicationStratProject$: Observable<EnvVarStratosProject>;
  applicationState$: Observable<ApplicationStateData>;
  applicationUrl$: Observable<string>;
  applicationRunning$: Observable<boolean>;

  /**
   * Fetch the current state of the app (given it's instances) as an object ready
   */
  static getApplicationState(
    store: Store<CFAppState>,
    appStateService: ApplicationStateService,
    app: IApp,
    appGuid: string,
    cfGuid: string): Observable<ApplicationStateData> {
    const dummyAction = new GetAppStatsAction(appGuid, cfGuid);
    const paginationMonitor = new PaginationMonitor(
      store,
      dummyAction.paginationKey,
      new CFEntityConfig(appStatsEntityType)
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
    ).pipe(publishReplay(1), refCount());
  }

  private constructCoreObservables() {
    // First set up all the base observables
    this.app$ = this.appEntityService.waitForEntity$;
    const moreWaiting$ = this.app$.pipe(
      filter(entityInfo => !!(entityInfo.entity && entityInfo.entity.entity && entityInfo.entity.entity.cfGuid)),
      map(entityInfo => entityInfo.entity.entity));
    this.appSpace$ = moreWaiting$.pipe(
      first(),
      switchMap(app => {
        return this.entityServiceFactory.create<APIResource<ISpace>>(
          app.space_guid,
          new GetSpace(app.space_guid, app.cfGuid, [createEntityRelationKey(spaceEntityType, organizationEntityType)], true)
        ).waitForEntity$.pipe(
          map(entityInfo => entityInfo.entity)
        );
      })
    );
    this.appOrg$ = moreWaiting$.pipe(
      first(),
      switchMap(app => this.appSpace$.pipe(
        map(space => space.entity.organization_guid),
        switchMap(orgGuid => {
          return this.store.select(selectCfEntity(organizationEntityType, orgGuid));
        }),
        filter(org => !!org)
      ))
    );

    this.isDeletingApp$ = this.appEntityService.isDeletingEntity$.pipe(publishReplay(1), refCount());

    this.waitForAppEntity$ = this.appEntityService.waitForEntity$.pipe(publishReplay(1), refCount());

    this.appSummary$ = this.waitForAppEntity$.pipe(
      switchMap(() => this.appSummaryEntityService.entityObs$),
      publishReplay(1),
      refCount()
    );

    this.appEnvVars = this.appEnvVarsService.createEnvVarsObs(this.appGuid, this.cfGuid);
  }

  public getApplicationEnvVarsMonitor() {
    const factory = new EntityMonitorFactory(this.store);
    return factory.create<APIResource<IApp>>(
      this.appGuid,
      new CFEntityConfig(appEnvVarsEntityType)
    );
  }

  private constructAmalgamatedObservables() {
    // Assign/Amalgamate them to public properties (with mangling if required)
    const action = new GetAppStatsAction(this.appGuid, this.cfGuid);
    const appStats = getPaginationObservables({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        new CFEntityConfig(appStatsEntityType)
      )
    }, true);
    // This will fail to fetch the app stats if the current app is not running but we're
    // willing to do this to speed up the initial fetch for a running application.
    this.appStats$ = appStats.entities$;

    this.appStatsFetching$ = appStats.pagination$.pipe(publishReplay(1), refCount());

    this.application$ = this.waitForAppEntity$.pipe(
      combineLatest(this.store.select(endpointEntitiesSelector)),
      filter(([{ entity }, endpoints]: [EntityInfo, any]) => {
        return entity && entity.entity && entity.entity.cfGuid;
      }),
      map(([{ entity, entityRequestInfo }, endpoints]: [EntityInfo, any]): ApplicationData => {
        return {
          fetching: entityRequestInfo.fetching,
          app: entity,
          stack: entity.entity.stack,
          cf: endpoints[entity.entity.cfGuid],
        };
      }), publishReplay(1), refCount());

    this.applicationState$ = this.waitForAppEntity$.pipe(
      combineLatest(this.appStats$.pipe(startWith(null))),
      map(([appInfo, appStatsArray]: [EntityInfo, APIResource<AppStat>[]]) => {
        return this.appStateService.get(appInfo.entity.entity, appStatsArray ? appStatsArray.map(apiResource => apiResource.entity) : null);
      }), publishReplay(1), refCount());

    this.applicationStratProject$ = this.appEnvVars.entities$.pipe(map(applicationEnvVars => {
      return this.appEnvVarsService.FetchStratosProject(applicationEnvVars[0].entity);
    }), publishReplay(1), refCount());

    this.applicationRunning$ = this.application$.pipe(
      map(app => app ? app.app.entity.state === 'STARTED' : false)
    );

  }

  private constructStatusObservables() {
    this.isFetchingApp$ = this.appEntityService.isFetchingEntity$;

    this.isUpdatingApp$ = this.appEntityService.entityObs$.pipe(map(a => {
      const updatingRoot = a.entityRequestInfo.updating[rootUpdatingKey] || { busy: false };
      const updatingSection = a.entityRequestInfo.updating[UpdateExistingApplication.updateKey] || { busy: false };
      return !!updatingRoot.busy || !!updatingSection.busy;
    }));

    this.isFetchingEnvVars$ = this.appEnvVars.pagination$.pipe(
      map(ev => getCurrentPageRequestInfo(ev).busy),
      startWith(false),
      publishReplay(1),
      refCount());

    this.isUpdatingEnvVars$ = this.appEnvVars.pagination$.pipe(map(
      ev => !!(getCurrentPageRequestInfo(ev).busy && ev.ids[ev.currentPage])
    ), startWith(false), publishReplay(1), refCount());

    this.isFetchingStats$ = this.appStatsFetching$.pipe(map(
      appStats => appStats ? getCurrentPageRequestInfo(appStats).busy : false
    ), startWith(false), publishReplay(1), refCount());

    this.applicationUrl$ = this.appSummaryEntityService.entityObs$.pipe(
      map(({ entity }) => entity),
      filter(app => !!app),
      map(applicationSummary => {
        const routes = applicationSummary.routes ? applicationSummary.routes : [];
        const nonTCPRoutes = routes.filter(p => p && !isTCPRoute(p.port));
        return nonTCPRoutes[0] || null;
      }),
      map(entRoute => !!entRoute && !!entRoute && !!entRoute.domain ?
        getRoute(entRoute.port, entRoute.host, entRoute.path, true, false, entRoute.domain.name) :
        null
      )
    );
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
    const actionState = selectUpdateInfo(applicationEntityType,
      this.appGuid,
      UpdateExistingApplication.updateKey);
    return this.store.select(actionState).pipe(filter(item => !item.busy));
  }
}
