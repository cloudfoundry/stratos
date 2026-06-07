/*
 * Public API Surface of store
 */

// Helpers
export * from './helpers/store-helpers';
export { LocalStorageService, LocalStorageSyncTypes } from './helpers/local-storage-service';

// Used by store testing module
export { getDefaultRequestState } from './types/entity-pipeline.types';
export { getDefaultPaginationEntityState } from './types/pagination.types';
export type { AuthTokenEnvelope, SessionDataEndpoint, TokenData } from './types/auth.types';
export { getDefaultRolesRequestState } from './types/current-user-roles.types';
export type { BaseEntityValues } from './types/entity.types';
export type {
  EntityRequestAction,
  ICFAction,
  InternalEndpointError,
  IFailedRequestAction,
  IStartRequestAction,
  ISuccessRequestAction,
  IUpdateRequestAction,
  RequestAction,
  SingleEntityAction,
} from './types/request.types';
export type { ApiRequestTypes } from './types/request.types';
export {
  APISuccessOrFailedAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from './types/request.types';

export type { PaginationFlattener } from './helpers/paginated-request-helpers';
export { flattenPagination, BaseHttpClientFetcher } from './helpers/paginated-request-helpers';

// Auto-generated from fiximports tool

export { EntityCatalogHelpers } from './entity-catalog/entity-catalog.helper';
export type {
  ActionDispatcher,
  EntityPipelineEntity,
  EntityUserRolesEndpoint,
  EntityUserRolesFetch,
  JetstreamResponse,
} from './types/entity-pipeline.types';
export { JetstreamError } from './types/entity-pipeline.types';
export type {
  EndpointOnlyAppState,
  GeneralRequestDataState,
  IRequestEntityTypeState,
  IRequestTypeState,
} from './app-state';
export {
  AppState,
  GeneralAppState,
  GeneralEntityAppState,
  InternalAppState,
} from './app-state';
export { RequestTypes, APIResponse } from './actions/request.actions';
export { LocalPaginationHelpers } from './helpers/local-list.helpers';
export { pick } from './helpers/reducer.helper';
export type { ApiKey } from './apiKey.types';
export type {
  PaginationPageIteratorConfig,
} from './types/entity-pipeline.types';
export {
  STRATOS_ENDPOINT_TYPE,
  endpointEntityType,
  stratosEntityFactory,
} from './helpers/stratos-entity-factory';
export type { IMetricApplication, IMetricCell } from './types/metric.types';
export { MetricQueryType } from './types/metric.types';
export { CATALOGUE_ENTITIES, EntityCatalogFeatureModule, EntityCatalogModule } from './entity-catalog.module';
export { EntityCatalogProvidersModule } from './entity-catalog-providers.module';
export type { MetricsAPITargets, MetricsStratosInfo } from './types/metrics-api.types';
export { getActions } from './actions/action.helper';
export { AppStoreModule } from './store.module';
export type { AuthState } from './types/auth.types';
export type { SessionUser } from './types/auth.types';
export type { StratosStatusMetadata } from './types/shared.types';
export { ComponentEntityMonitorConfig, StratosStatus } from './types/shared.types';
export {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
export { getFavoriteInfoObservable } from './helpers/store-helpers';
export {
  JetStreamErrorResponse,
  cfAPIVersion,
  httpErrorResponseToSafeString,
  isHttpErrorResponse,
  proxyAPIVersion,
} from './jetstream';
export type { RoutingEvent } from './types/routing.type';
export type { IFavoriteMetadata, IFavoritesInfo, UserFavoriteEndpoint, IEndpointFavMetadata, FavoriteIconData } from './types/user-favorites.types';
export { UserFavorite } from './types/user-favorites.types';
export { UserFavoriteManager } from './user-favorite-manager';
export { UserFavoritesDataService } from './services/user-favorites-data.service';
export { TestEntityCatalog, entityCatalog } from './entity-catalog/entity-catalog';
export { ENTITY_CATALOG_TOKEN } from './tokens/store-injection.tokens';
export type { InternalEventState } from './types/internal-events.types';
export { InternalEventSeverity } from './types/internal-events.types';
export {
  AddParams,
  ClearPaginationOfEntity,
  ClearPaginationOfType,
  CreatePagination,
  IgnorePaginationMaxedState,
  RemoveParams,
  SetClientFilter,
  SetClientFilterKey,
  SetClientPage,
  SetClientPageSize,
  SetInitialParams,
  SetPage,
  SetParams,
  SetResultCount,
  ResetPagination,
  ResetPaginationSortFilter,
  getPaginationKey,
} from './actions/pagination.actions';
export type { UserProfileInfo, UserProfileInfoEmail, UserProfileInfoUpdates } from './types/user-profile.types';
export { UserProfileDataService } from './services/user-profile-data.service';
export { BrowserStandardEncoder } from './browser-encoder';
export type { IUserFavoritesGroups } from './types/favorite-groups.types';
export { getEndpointIDFromFavorite } from './user-favorite-helpers';
export type { MenuItem } from './types/menu-item.types';
export type { IRecentlyVisitedEntity } from './types/recently-visited.types';
export type { EndpointAuthTypeConfig, EndpointType, IAuthForm, IEndpointAuthComponent } from './extension-types';
export type {
  EntityCatalogEntityConfig,
  EntityCatalogSchemas,
  IStratosEndpointDefinition,
  IStratosEntityDefinition,
  StratosEndpointExtensionDefinition,
} from './entity-catalog/entity-catalog.types';
export {
  EndpointHealthCheck,
} from './entity-catalog/entity-catalog.types';
export type { APIResource, EntityInfo, NormalizedResponse } from './types/api.types';
export { getFullEndpointApiUrl, countDuplicateUrlEndpoints } from './endpoint-utils';
export type { PaginatedAction, BasePaginatedAction, PaginationClientFilter, PaginationParam } from './types/pagination.types';
export { PaginationEntityState, isPaginatedAction } from './types/pagination.types';
export { MAX_RECENT_COUNT, RecentlyVisitedDataService } from './services/recently-visited-data.service';
export type { ActionState, RequestInfoState } from './types/entity-pipeline.types';
export { getDefaultActionState, rootUpdatingKey } from './types/entity-pipeline.types';
export type { EndpointModel, EndpointUser, INewlyConnectedEndpointInfo } from './types/endpoint.types';
export { SystemSharedUserGuid } from './types/endpoint.types';
export { stratosEntityCatalog } from './stratos-entity-catalog';
export { EntityCatalogHelper } from './entity-catalog/entity-catalog-entity/entity-catalog.service';
export type { PermissionValues } from './types/current-user-roles.types';
export type { SessionData, SessionDataConfig } from './types/auth.types';
export { APIKeysEnabled, UserEndpointsEnabled } from './types/auth.types';
export type { RouterRedirect } from './types/auth.types';
export { EntitySchema } from './helpers/entity-schema';
export type {
  ChartSeries,
  IMetricMatrixResult,
  IMetrics,
  IMetricsData,
  MetricsFilterSeries,
} from './types/base-metric.types';
export {
  MetricResultTypes,
} from './types/base-metric.types';
export { generateStratosEntities } from './stratos-entity-generator';
export { MetricQueryConfig } from './actions/metrics.actions';
export { defaultClientPaginationPageSize } from './types/pagination.types';
export { appReducers } from './reducers.module';
export { EntityCatalogTestModule, EntityCatalogTestModuleManualStore, TEST_CATALOGUE_ENTITIES } from './entity-catalog-test.module';

// Re-export of @ngrx/store runtime tokens. Consumer packages
// mid-way through the wave-3 signal-native migration (e.g. `git`,
// `cloud-foundry`) need to inject/use the legacy store without
// naming @ngrx/store directly inside their own `src/`. The store
// package itself still owns the ngrx dependency; this is a deliberate
// compatibility shim that should be removed once all callers
// move off the legacy store.
export { Action, Store, StoreModule, createSelector, provideStore, select } from '@ngrx/store';

// Same shim for @ngrx/effects. Mid-migration packages still need
// to register effects against the legacy ngrx action stream while
// their consumers complete the transition to signal-native data
// services. Remove once no package outside this one names
// @ngrx/effects.
export { EffectsModule, EffectsFeatureModule } from '@ngrx/effects';
export { Actions, createEffect, ofType } from '@ngrx/effects';

// W36-B Wave 1 — signal-native endpoints data service. Wave 3 dispatcher
// + monitor consumers import from here; Wave 5 deletion of the legacy
// `endpoint.actions` / `endpoint.effects` / `endpoint.selectors` slice
// retires the parallel ngrx path that this service replaces.
export {
  EndpointsDataService,
} from './services/endpoints-data.service';
export type {
  EndpointConnectEvent,
  EndpointConnectOptions,
  EndpointDisconnectEvent,
  EndpointFetchingState,
  EndpointRegisterOptions,
  EndpointUpdateOptions,
} from './services/endpoints-data.service';
export { EndpointDisconnectCleanupService } from './services/endpoint-disconnect-cleanup.service';

// W-a1 — signal-native metrics data service. Replaces the V2
// MetricsAction / EntityServiceFactory / getPaginationObservables paths
// for CF metric fetches. PR-A2 deletes cf-metrics.actions.ts +
// metrics.effects.ts once all consumers (chart component + range
// selectors + 4 call sites) migrate to this service.
export { MetricsDataService } from './services/metrics-data.service';
export type {
  MetricsFetchState,
  MetricsObservation,
  MetricsRequest,
} from './services/metrics-data.service';

// W36-C Wave 1 — signal-native auth data service. Single bridge over the
// legacy `auth` ngrx slice. Replaces direct `store.select(s => s.auth)`
// reads in `AuthSignalService` and consolidates `VerifySession` / `RouterNav`
// dispatch into one place so downstream consumers stay Store-free.
export { AuthDataService } from './services/auth-data.service';

// Signal-native routing-history service. Replaces the ngrx router-store
// `state.routing` slice read via `getPreviousRoutingState` /
// `getCurrentRoutingState`; tracks current/previous route from Angular Router
// NavigationEnd events.
export { RoutingHistoryService } from './services/routing-history.service';

// W36-C Wave 2 — signal-native current-user-roles data service. Single
// bridge over the legacy `currentUserRoles` ngrx slice. Replaces direct
// `store.select(getCurrentUserStratosRole(...))` /
// `store.select(getCurrentUserStratosHasScope(...))` reads in
// `CurrentUserRolesSignalService` and underpins the cf-side
// `CfCurrentUserRolesDataService` in the cloud-foundry package.
export { CurrentUserRolesDataService } from './services/current-user-roles-data.service';
// Shared favorites/recents cleanup for entity deletes — invoked by signal-native
// delete paths (CF delete controller hook, kube resource delete) so they stay
// @ngrx-free while the favorites/recents stores remain ngrx.
export { EntityDeleteCleanupService } from './services/entity-delete-cleanup.service';
export { EndpointErrorEventsService } from './services/endpoint-error-events.service';
