import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { combineLatest, filter, first, map, publishReplay, refCount, startWith, switchMap } from 'rxjs/operators';

import { CFEntityConfig, CF_ENDPOINT_TYPE } from '../../../../cloud-foundry/cf-types';
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
import { GetAllOrganizationDomains } from '../../../../cloud-foundry/src/actions/organization.actions';
import { GetSpace } from '../../../../cloud-foundry/src/actions/space.actions';
import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
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
import { IApp, IAppSummary, IDomain, IOrganization, ISpace } from '../../../../core/src/core/cf-api.types';
import { EntityService } from '../../../../core/src/core/entity-service';
import { EntityServiceFactory } from '../../../../core/src/core/entity-service-factory.service';
import {
  ApplicationStateData,
  ApplicationStateService,
} from '../../../../core/src/shared/components/application-state/application-state.service';
import { APP_GUID, CF_GUID } from '../../../../core/src/shared/entity.tokens';
import { EntityMonitorFactory } from '../../../../core/src/shared/monitors/entity-monitor.factory.service';
import { PaginationMonitor } from '../../../../core/src/shared/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../../../../core/src/shared/monitors/pagination-monitor.factory';
import {
  getCurrentPageRequestInfo,
  getPaginationObservables,
  PaginationObservables,
} from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { selectUpdateInfo } from '../../../../store/src/selectors/api.selectors';
import { endpointEntitiesSelector } from '../../../../store/src/selectors/endpoint.selectors';
import { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../store/src/types/pagination.types';

import { getRoute, isTCPRoute } from './routes/routes.helper';
import { createEntityRelationKey } from '../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  ApplicationEnvVarsHelper,
  EnvVarStratosProject
} from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { AppStat } from '../../store/types/app-metadata.types';
import { selectCfEntity } from '../../store/selectors/api.selectors';
import { rootUpdatingKey, ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';


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
    const dummyAction = new GetAppStatsAction(appGuid, cfGuid);
    const paginationMonitor = new PaginationMonitor(
      store,
      dummyAction.paginationKey,
      dummyAction
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
        return getPaginationObservables<APIResource<IDomain>>(
          {
            store: this.store,
            action: domainsAction,
            paginationMonitor: this.paginationMonitorFactory.create(
              domainsAction.paginationKey,
              action
            )
          },
          true
        ).entities$;
      }),
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
      entityCatalogue.getEntityKey(CF_ENDPOINT_TYPE, applicationEntityType),
      this.appGuid,
      UpdateExistingApplication.updateKey
    );
    return this.store.select(actionState).pipe(filter(item => !item.busy), first());
  }
}

