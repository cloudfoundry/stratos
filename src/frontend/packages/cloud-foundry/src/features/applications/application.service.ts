import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { combineLatest, filter, first, map, pairwise, publishReplay, refCount, startWith, switchMap } from 'rxjs/operators';

import { AppMetadataTypes } from '../../../../cloud-foundry/src/actions/app-metadata.actions';
import {
  GetApplication,
  UpdateApplication,
  UpdateExistingApplication,
} from '../../../../cloud-foundry/src/actions/application.actions';
import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import {
  applicationEntityType,
  domainEntityType,
  organizationEntityType,
  routeEntityType,
  serviceBindingEntityType,
  spaceEntityType,
  stackEntityType,
} from '../../../../cloud-foundry/src/cf-entity-types';
import { APP_GUID, CF_GUID } from '../../../../core/src/shared/entity.tokens';
import { EntityService } from '../../../../store/src/entity-service';
import { ActionState, rootUpdatingKey } from '../../../../store/src/reducers/api-request-reducer/types';
import {
  getCurrentPageRequestInfo,
  PaginationObservables,
} from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.types';
import { endpointEntitiesSelector } from '../../../../store/src/selectors/endpoint.selectors';
import { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../store/src/types/pagination.types';
import { IApp, IAppSummary, IDomain, IOrganization, ISpace, IStack } from '../../cf-api.types';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { createEntityRelationKey } from '../../entity-relations/entity-relations.types';
import { ApplicationStateData, ApplicationStateService } from '../../shared/services/application-state.service';
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
  app: APIResource<IApp>;
  stack: APIResource<IStack>;
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
    private appStateService: ApplicationStateService,
    private appEnvVarsService: ApplicationEnvVarsHelper,
  ) {
    this.appEntityService = cfEntityCatalog.application.store.getEntityService(
      appGuid,
      cfGuid,
      {
        includeRelations: createGetApplicationAction(appGuid, cfGuid).includeRelations,
        populateMissing: true
      }
    );
    this.appSummaryEntityService = cfEntityCatalog.appSummary.store.getEntityService(
      appGuid,
      cfGuid
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
    appStateService: ApplicationStateService,
    app: IApp,
    appGuid: string,
    cfGuid: string): Observable<ApplicationStateData> {
    return cfEntityCatalog.appStats.store.getPaginationMonitor(appGuid, cfGuid).currentPage$.pipe(
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
        return cfEntityCatalog.space.store.getWithOrganization.getEntityService(
          app.space_guid,
          app.cfGuid,
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
    return cfEntityCatalog.appEnvVar.store.getEntityMonitor(
      this.appGuid
    )
  }

  private constructAmalgamatedObservables() {
    // Assign/Amalgamate them to public properties (with mangling if required)
    const appStats = cfEntityCatalog.appStats.store.getPaginationService(this.appGuid, this.cfGuid)
    // This will fail to fetch the app stats if the current app is not running but we're
    // willing to do this to speed up the initial fetch for a running application.
    this.appStats$ = appStats.entities$;

    this.appStatsFetching$ = appStats.pagination$.pipe(publishReplay(1), refCount());

    this.application$ = this.waitForAppEntity$.pipe(
      combineLatest(this.store.select(endpointEntitiesSelector)),
      filter(([entityInfo]) => {
        return !!entityInfo && !!entityInfo.entity && !!entityInfo.entity.entity && !!entityInfo.entity.entity.cfGuid;
      }),
      map(([{ entity, entityRequestInfo }, endpoints]): ApplicationData => {
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
      switchMap(org =>
        cfEntityCatalog.domain.store.getOrganizationDomains.getPaginationService(org.metadata.guid, this.cfGuid).entities$
      ),
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
    return cfEntityCatalog.application.api.update<ActionState>(
      this.appGuid,
      this.cfGuid,
      { ...updatedApplication },
      existingApplication,
      updateEntities
    ).pipe(
      pairwise(),
      filter(([oldS, newS]) => oldS.busy && !newS.busy),
      map(([, newS]) => newS),
      first()
    );
  }
}

