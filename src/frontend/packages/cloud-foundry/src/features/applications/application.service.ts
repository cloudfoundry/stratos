import { Injectable, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of as observableOf } from 'rxjs';
import { filter, map, pairwise, publishReplay, refCount, take, withLatestFrom } from 'rxjs/operators';

import { APP_GUID, CF_GUID } from '@stratosui/core';
import {
  ActionState,
  APIResource,
  EntityInfo,
  EntityService,
  PaginationObservables,
  RequestInfoState,
  rootUpdatingKey,
  Store
} from '@stratosui/store';
import { AppMetadataTypes } from '../../actions/app-metadata.actions';
import { GetApplication, UpdateApplication, UpdateExistingApplication } from '../../actions/application.actions';
import { CFAppState } from '../../cf-app-state';
import {
  applicationEntityType,
  domainEntityType,
  organizationEntityType,
  routeEntityType,
  serviceBindingEntityType,
  spaceEntityType,
  stackEntityType
} from '../../cf-entity-types';
import { IApp, IAppSummary } from '../../cf-api.types';
import { CfEndpointsDataService } from '../../services/domain-data/cf-endpoints-data.service';
import { StDomain, StOrg, StSpace } from '../../services/endpoint-data/stratos-types';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { createEntityRelationKey } from '../../entity-relations/entity-relations.types';
import { ApplicationStateData, ApplicationStateService } from '../../shared/services/application-state.service';
import { ApplicationEnvVarsHelper } from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { AppDetailDataService } from './app-detail-data.service';
import { AppStat } from '../../store/types/app-metadata.types';
import { stToLegacy } from '../../services/v3-to-legacy-adapter';
import { EnvVarStratosProject } from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';

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
  stack: APIResource<any>;
  cf: any;
}

/**
 * Facade shim — wraps AppDetailDataService signals as the legacy
 * observable surface so unmigrated tabs continue to work without
 * change. Each tab migration deletes another bridge accessor; the
 * shim dies when the last tab migrates.
 *
 * Component-scoped at application-base.component (matches the data
 * service's lifetime). Was providedIn: 'root' historically; that was
 * an injection-token bug — APP_GUID/CF_GUID come from the route.
 *
 * entityService and appEnvVars are kept from the legacy ngrx path
 * because the variables tab accesses
 * ngrx-specific properties (poll(), action, entities$) that cannot
 * be replaced without a full ngrx removal — which is deferred.
 */
@Injectable()
export class ApplicationService {
  // Static utility — used by app list cards, the home compact-app-card, and
  // the table-cell app status renderer. Independent of the per-app detail
  // page lifecycle; pulls live stats from the legacy ngrx paginator and
  // composes via ApplicationStateService. Stays here because consumers
  // already import ApplicationService for the static call.
  static getApplicationState(
    appStateService: ApplicationStateService,
    app: IApp,
    appGuid: string,
    cfGuid: string,
  ): Observable<ApplicationStateData> {
    return cfEntityCatalog.appStats.store
      .getPaginationMonitor(appGuid, cfGuid).currentPage$
      .pipe(
        map(appInstancesPages => appStateService.get(app, appInstancesPages)),
        publishReplay(1),
        refCount(),
      );
  }

  cfGuid = inject(CF_GUID);
  appGuid = inject(APP_GUID);
  private store = inject<Store<CFAppState>>(Store);
  private appEnvVarsService = inject(ApplicationEnvVarsHelper);
  private detail = inject(AppDetailDataService);
  private cfEndpoints = inject(CfEndpointsDataService);

  // ---------------------------------------------------------------------------
  // Legacy ngrx EntityService — kept for application-tabs-base
  // (entityMonitor.entityRequest$, updatingSection$).
  // ---------------------------------------------------------------------------
  public entityService: EntityService<APIResource<IApp>>;
  private appSummaryEntityService: EntityService<IAppSummary>;

  // ---------------------------------------------------------------------------
  // Legacy ngrx paginator — kept for variables-tab (appEnvVars.entities$).
  // ---------------------------------------------------------------------------
  appEnvVars: PaginationObservables<APIResource>;

  constructor() {
    const cfGuid = this.cfGuid;
    const appGuid = this.appGuid;

    this.entityService = cfEntityCatalog.application.store.getEntityService(
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

    this.appEnvVars = this.appEnvVarsService.createEnvVarsObs(appGuid, cfGuid);
  }

  // ---------------------------------------------------------------------------
  // Signal → Observable bridges
  // Each accessor below reflects the exact shape the legacy consumers expect.
  // ---------------------------------------------------------------------------

  /**
   * app$ — EntityInfo<APIResource<IApp>>.
   * Consumers use: app.entity (the APIResource), app.entity.entity (IApp),
   * app.entity.metadata.guid, app.entityRequestInfo.fetching.
   */
  app$: Observable<EntityInfo<APIResource<IApp>>> = toObservable(
    computed(() => entityInfoOf(
      this.detail.app(),
      this.detail.loading().app,
      this.detail.errors().app,
    ))
  );

  /**
   * waitForAppEntity$ — same shape as app$ but only emits once the entity is
   * populated (no undefined entity). Mirrors the legacy entityService.waitForEntity$
   * which filters on isEntityAvailable().
   */
  waitForAppEntity$: Observable<EntityInfo<APIResource<IApp>>> = this.app$.pipe(
    filter(info => !!info.entity),
    publishReplay(1),
    refCount(),
  );

  /**
   * appSummary$ — EntityInfo<IAppSummary>.
   * Consumers: build-tab uses entity?.services?.length and entity?.routes?.length.
   * Note: the legacy service wrapped IAppSummary directly in EntityInfo (not APIResource).
   * The data service no longer fetches /summary as a separate kind — the
   * StAppDetail envelope carries every Summary tab field, and the adapter
   * derives IAppSummary from it. Tie loading/error to the `app` kind since
   * that's the fetch the summary data piggybacks on.
   */
  appSummary$: Observable<EntityInfo<IAppSummary>> = toObservable(
    computed(() => ({
      entity: this.detail.summary() as IAppSummary,
      entityRequestInfo: requestInfoOf(this.detail.loading().app, this.detail.errors().app),
    }))
  );

  /**
   * appStats$ — AppStat[].
   * Consumers iterate the array for per-instance stats. The data
   * service holds the trimmed V3 shape (index/state); the adapter
   * widens to the legacy AppStat shape with cpu/uptime/memory zero-
   * filled. Consumers reading those fields (e.g. the auto-scaler
   * monitor) get zeros until the Instances tab migration brings a
   * richer stats endpoint.
   */
  appStats$: Observable<AppStat[]> = toObservable(
    computed(() => stToLegacy.appStats(this.detail.stats(), this.cfGuid, this.appGuid))
  );

  /**
   * applicationState$ — ApplicationStateData (label/indicator/actions).
   * Derived by appStateService from app entity + stats.
   */
  applicationState$: Observable<ApplicationStateData> = toObservable(this.detail.state);

  /**
   * applicationStratProject$ — EnvVarStratosProject.
   * Extracted from VCAP env vars (STRATOS_PROJECT). Only emits when the
   * project is non-null — mirrors the legacy observable which was derived from
   * appEnvVars.entities$ and would not emit until env vars were loaded.
   * Consumers such as GitSCMTabComponent do take(1) on this and crash if they
   * receive null, so we filter it at the bridge.
   */
  applicationStratProject$: Observable<EnvVarStratosProject> = toObservable(
    computed(() => this.detail.stratosProject() as EnvVarStratosProject)
  ).pipe(filter((p): p is EnvVarStratosProject => p != null));

  /**
   * applicationUrl$ — string | null.
   * First non-TCP route URL from the app summary.
   */
  applicationUrl$: Observable<string> = toObservable(
    computed(() => this.detail.url() as string)
  );

  /**
   * applicationRunning$ — true when app state is STARTED.
   */
  applicationRunning$: Observable<boolean> = toObservable(this.detail.running);

  /**
   * appOrg$ — StOrg | undefined.
   * Used by build-tab, action-bar, tabs-base (breadcrumbs, env-vars permission).
   */
  appOrg$: Observable<StOrg | undefined> = toObservable(
    computed(() => this.detail.org())
  ).pipe(filter(org => !!org));

  /**
   * appSpace$ — StSpace | undefined.
   * Used by build-tab, action-bar, tabs-base (breadcrumbs, env-vars permission).
   */
  appSpace$: Observable<StSpace | undefined> = toObservable(
    computed(() => this.detail.space())
  ).pipe(filter(space => !!space));

  /**
   * orgDomains$ — StDomain[].
   * Used by add-routes to list available domains for the org.
   */
  orgDomains$: Observable<StDomain[]> = toObservable(
    computed(() => this.detail.domains() ?? [])
  );

  /**
   * application$ — ApplicationData { fetching, app, stack, cf }.
   * Consumers: build-tab, edit-application, cli-info, action-bar, autoscaler.
   * The `cf` (EndpointModel) field still comes from the ngrx endpoints store
   * because AppDetailDataService does not replicate endpoint metadata.
   * The `stack` field comes from the app entity's inline stack relation.
   */
  application$: Observable<ApplicationData> = toObservable(
    computed(() => {
      const app = this.detail.app();
      return {
        fetching: this.detail.loading().app,
        app: app as APIResource<IApp>,
        stack: app?.entity?.stack as APIResource<any>,
        cf: null as any,   // patched below via withLatestFrom(endpoints$)
      } as ApplicationData;
    })
  ).pipe(
    filter(data => !!data.app),
    // Attach the endpoint model from the ngrx store so cf?.guid / cf?.name work.
    // This keeps the legacy consumer API intact without adding endpoint HTTP fetches.
    withLatestFrom(toObservable(this.cfEndpoints.all)),
    map(([data, endpoints]) => ({ ...data, cf: endpoints?.[this.cfGuid] ?? null })),
    publishReplay(1),
    refCount(),
  );

  // ---------------------------------------------------------------------------
  // Status observables — bridge from data service loading signals.
  // ---------------------------------------------------------------------------

  isFetchingApp$: Observable<boolean> = toObservable(
    computed(() => this.detail.loading().app)
  );

  /**
   * isUpdatingApp$ — true when an update action is in flight.
   * Legacy used ngrx updating sections; facade uses the data service loading signal.
   * Consumers: instances card (disable scale buttons), tabs-base (summaryDataChanging).
   */
  isUpdatingApp$: Observable<boolean> = toObservable(
    computed(() => this.detail.loading().app)
  );

  isDeletingApp$: Observable<boolean> = observableOf(false);

  isFetchingEnvVars$: Observable<boolean> = toObservable(
    computed(() => this.detail.loading().envVars)
  );

  isUpdatingEnvVars$: Observable<boolean> = toObservable(
    computed(() => this.detail.loading().envVars)
  );

  isFetchingStats$: Observable<boolean> = toObservable(
    computed(() => this.detail.loading().stats)
  );

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  /**
   * getApplicationEnvVarsMonitor — kept for compatibility with components that
   * need a direct entity monitor on env vars.
   */
  public getApplicationEnvVarsMonitor() {
    return cfEntityCatalog.appEnvVar.store.getEntityMonitor(
      this.appGuid
    );
  }

  /**
   * isEntityComplete — utility used by some consumers.
   */
  isEntityComplete(value: any, requestInfo: { fetching: boolean }): boolean {
    if (requestInfo) {
      return !requestInfo.fetching;
    } else {
      return !!value;
    }
  }

  /**
   * updateApplication — dispatch a legacy ngrx update action and wait for it
   * to settle. Keeps the edit-application step working unchanged.
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
      take(1)
    );
  }
}

// ---------------------------------------------------------------------------
// Helper — build an EntityInfo<APIResource<T>> from data service state.
// ---------------------------------------------------------------------------

function entityInfoOf<T>(
  entity: T | undefined,
  fetching: boolean,
  error: any,
): EntityInfo<T> {
  return {
    entity: entity as T,
    entityRequestInfo: requestInfoOf(fetching, error),
  };
}

function requestInfoOf(fetching: boolean, error: any): RequestInfoState {
  return {
    fetching,
    error: !!error,
    message: error?.detail ?? error?.message ?? '',
    creating: false,
    updating: { [rootUpdatingKey]: { busy: false, error: false, message: '' } },
    deleting: { busy: false, error: false, message: '', deleted: false },
  };
}
