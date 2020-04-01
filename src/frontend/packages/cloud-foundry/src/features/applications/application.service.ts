import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { combineLatest, filter, first, map, publishReplay, refCount, startWith, switchMap } from 'rxjs/operators';

import { AppMetadataTypes } from '../../../../cloud-foundry/src/actions/app-metadata.actions';
import {
  GetApplication,
  UpdateApplication,
  UpdateExistingApplication,
} from '../../../../cloud-foundry/src/actions/application.actions';
import { GetAllOrganizationDomains } from '../../../../cloud-foundry/src/actions/organization.actions';
import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import {
  appEnvVarsEntityType,
  applicationEntityType,
  appStatsEntityType,
  appSummaryEntityType,
  domainEntityType,
  organizationEntityType,
  routeEntityType,
  serviceBindingEntityType,
  spaceEntityType,
  spaceWithOrgEntityType,
  stackEntityType,
} from '../../../../cloud-foundry/src/cf-entity-types';
import { IApp, IAppSummary, IDomain, IOrganization, ISpace } from '../../../../core/src/core/cf-api.types';
import {
  ApplicationStateData,
  ApplicationStateService,
} from '../../../../core/src/shared/components/application-state/application-state.service';
import { APP_GUID, CF_GUID } from '../../../../core/src/shared/entity.tokens';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog.service';
import { EntityService } from '../../../../store/src/entity-service';
import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { EntityMonitorFactory } from '../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitor } from '../../../../store/src/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
import { ActionState, rootUpdatingKey } from '../../../../store/src/reducers/api-request-reducer/types';
import {
  getCurrentPageRequestInfo,
  getPaginationObservables,
  PaginationObservables,
} from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { selectUpdateInfo } from '../../../../store/src/selectors/api.selectors';
import { endpointEntitiesSelector } from '../../../../store/src/selectors/endpoint.selectors';
import { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { PaginatedAction, PaginationEntityState } from '../../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../../cf-entity-factory';
import { CF_ENDPOINT_TYPE, CFEntityConfig } from '../../cf-types';
import { createEntityRelationKey } from '../../entity-relations/entity-relations.types';
import { AppStat } from '../../store/types/app-metadata.types';
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
    const appSummaryEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, appSummaryEntityType);
    const actionBuilder = appSummaryEntity.actionOrchestrator.getActionBuilder('get');
    const getAppSummaryAction = actionBuilder(appGuid, cfGuid);
    this.appSummaryEntityService = this.entityServiceFactory.create<IAppSummary>(
      appGuid,
      getAppSummaryAction
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
  appStats$: Observable<AppStat[]>;
  private appStatsFetching$: Observable<PaginationEntityState>; // Use isFetchingStats$ which is properly gated
  appEnvVars: PaginationObservables<APIResource>;
  appOrg$: Observable<APIResource<IOrganization>>;
  appSpace$: Observable<APIResource<ISpace>>;

  application$: Observable<ApplicationData>;
  applicationStratProject$: Observable<EnvVarStratosProject>;
  applicationState$: Observable<ApplicationStateData>;
  applicationUrl$: Observable<string>;
  applicationRunning$: Observable<boolean>;
  orgDomains$: Observable<APIResource<IDomain>[]>;

  /**
   * Fetch the current state of the app (given it's instances) as an object ready
   */
  static getApplicationState(
    store: Store<CFAppState>,
    appStateService: ApplicationStateService,
    app: IApp,
    appGuid: string,
    cfGuid: string): Observable<ApplicationStateData> {
    const appStatsEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, appStatsEntityType);
    const actionBuilder = appStatsEntity.actionOrchestrator.getActionBuilder('get');
    const dummyAction = actionBuilder(appGuid, cfGuid) as PaginatedAction;
    const paginationMonitor = new PaginationMonitor(
      store,
      dummyAction.paginationKey,
      dummyAction,
      dummyAction.flattenPagination
    );
    return paginationMonitor.currentPage$.pipe(
      map(appInstancesPages => {
        return appStateService.get(app, appInstancesPages);
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
        const spaceEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, spaceEntityType);
        const actionBuilder = spaceEntity.actionOrchestrator.getActionBuilder('get');
        const getSpaceAction = actionBuilder(
          app.space_guid,
          app.cfGuid,
          { includeRelations: [createEntityRelationKey(spaceEntityType, organizationEntityType)], populateMissing: true }
        );
        getSpaceAction.entity = cfEntityFactory(spaceWithOrgEntityType);
        getSpaceAction.schemaKey = spaceWithOrgEntityType;
        return this.entityServiceFactory.create<APIResource<ISpace>>(
          app.space_guid,
          getSpaceAction
        ).waitForEntity$.pipe(
          map(entityInfo => entityInfo.entity)
        );
      }),
      publishReplay(1),
      refCount()
    );
    this.appOrg$ = moreWaiting$.pipe(
      first(),
      switchMap(() => this.appSpace$),
      map(space => space.entity.organization),
      filter(org => !!org)
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
    const appStatsEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, appStatsEntityType);
    const actionBuilder = appStatsEntity.actionOrchestrator.getActionBuilder('get');
    const action = actionBuilder(this.appGuid, this.cfGuid) as PaginatedAction;
    const appStats = getPaginationObservables({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        new CFEntityConfig(appStatsEntityType),
        action.flattenPagination
      )
    }, true);
    // This will fail to fetch the app stats if the current app is not running but we're
    // willing to do this to speed up the initial fetch for a running application.
    this.appStats$ = appStats.entities$;

    this.appStatsFetching$ = appStats.pagination$.pipe(publishReplay(1), refCount());

    this.application$ = this.waitForAppEntity$.pipe(
      combineLatest(this.store.select(endpointEntitiesSelector)),
      filter(([{ entity }]: [EntityInfo, any]) => {
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
      map(([appInfo, appStatsArray]: [EntityInfo, AppStat[]]) => {
        return this.appStateService.get(appInfo.entity.entity, appStatsArray || null);
      }), publishReplay(1), refCount());

    this.applicationStratProject$ = this.appEnvVars.entities$.pipe(map(applicationEnvVars => {
      return this.appEnvVarsService.FetchStratosProject(applicationEnvVars[0].entity);
    }), publishReplay(1), refCount());

    this.applicationRunning$ = this.application$.pipe(
      map(app => app ? app.app.entity.state === 'STARTED' : false)
    );

    // In an ideal world we'd get domains inline with the application, however the inline path from app to org domains exceeds max cf depth
    // of 2 (app --> space --> org --> domains).
    this.orgDomains$ = this.appOrg$.pipe(
      switchMap(org => {
        const domainsAction = new GetAllOrganizationDomains(org.metadata.guid, this.cfGuid);
        const paginationMonitor = this.paginationMonitorFactory.create(
          domainsAction.paginationKey,
          domainsAction,
          domainsAction.flattenPagination
        );
        return getPaginationObservables<APIResource<IDomain>>(
          {
            store: this.store,
            action: domainsAction,
            paginationMonitor
          },
          true
        ).entities$;
      }),
      publishReplay(1),
      refCount()
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
    const actionState = selectUpdateInfo(
      entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, applicationEntityType),
      this.appGuid,
      UpdateExistingApplication.updateKey
    );
    return this.store.select(actionState).pipe(filter(item => !item.busy), first());
  }
}

