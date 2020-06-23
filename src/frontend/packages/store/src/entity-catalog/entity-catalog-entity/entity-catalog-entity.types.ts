import { EntityService } from '../../entity-service';
import { EntityMonitor } from '../../monitors/entity-monitor';
import { PaginationMonitor } from '../../monitors/pagination-monitor';
import { PaginationObservables } from '../../reducers/pagination-reducer/pagination-reducer.types';
import { PaginatedAction } from '../../types/pagination.types';
import { OrchestratedActionBuilders, OrchestratedActionCoreBuilders } from '../action-orchestrator/action-orchestrator';
import { KnownKeys } from './type.helpers';

type NeverKeys<T extends object> = Exclude<{
  [K in keyof T]: T[K] extends never
  ? K
  : never
}[keyof T], undefined>

/**
 * Pick all properties who's function has the specified return type U
 */
type FilteredByReturnType<T extends { [key: string]: (...args: any[]) => any }, U> = {
  [P in keyof T]: ReturnType<T[P]> extends U ? T[P] : never
};

/**
 * Pick all properties who's function do not have the specified return type U
 */
type FilteredByNotReturnType<T extends { [key: string]: (...args: any[]) => any }, U> = {
  [P in keyof T]: ReturnType<T[P]> extends U ? never : T[P]
};

/**
 * Core entity and entities access (entity/entities monitors and services)
 */
export interface CoreEntityCatalogEntityStore<Y, ABC extends OrchestratedActionBuilders> {
  /**
   * Return a collection of observables for the given entity id. If the entity is missing is will NOT be fetched
   */
  getEntityMonitor: (
    entityId: string,
    params?: {
      schemaKey?: string,
      startWithNull?: boolean
    }
  ) => EntityMonitor<Y>;
  /**
   * Return a collection of observables for the given entity id. Subscribing to core observables (like entityObs$) will fetch the entity if missing
   */
  getEntityService: (
    ...args: Parameters<ABC['get']>
  ) => EntityService<Y>;
  /**
   * Return a collection of observables for the given collection of entities. If the collection is missing it will NOT be fetched
   */
  getPaginationMonitor: (
    ...args: Parameters<ABC['getMultiple']>
  ) => PaginationMonitor<Y>;
  /**
   * Return a collection of observables for the given collection of entities. Subscribing to core (like entities$) will fetch the entity if missing
   */
  getPaginationService: (
    ...args: Parameters<ABC['getMultiple']>
  ) => PaginationObservables<Y>;
}

/**
 * Filter out all common builders in OrchestratedActionCoreBuilders from ABC
 */
type CustomBuilders<ABC> = Omit<Pick<ABC, KnownKeys<ABC>>, keyof OrchestratedActionCoreBuilders>;

/**
 * Mark builders that don't return a pagination action as `never`
 */
type PaginatedActionBuildersWithNevers<ABC extends OrchestratedActionBuilders> = FilteredByReturnType<CustomBuilders<ABC>, PaginatedAction>;
/**
 * Filter out builders that don't return pagination actions from ABC
 */
type PaginatedActionBuilders<ABC extends OrchestratedActionBuilders> = Omit<PaginatedActionBuildersWithNevers<ABC>, NeverKeys<PaginatedActionBuildersWithNevers<ABC>>>

/**
 * Mark builders that return a pagination action as `never`
 */
type NonPaginatedActionBuildersWithNevers<ABC extends OrchestratedActionBuilders> = FilteredByNotReturnType<CustomBuilders<ABC>, PaginatedAction>;
/**
 * Filter out builders that return pagination actions from ABC
 */
type NonPaginatedActionBuilders<ABC extends OrchestratedActionBuilders> = Omit<NonPaginatedActionBuildersWithNevers<ABC>, NeverKeys<NonPaginatedActionBuildersWithNevers<ABC>>>


/**
 * Provided a typed way to create pagination monitor/service per action (this ultimately only provides ones for paginated actions)
 */
type EntityCatalogEntityStoreCollections<Y, ABC extends OrchestratedActionBuilders, PABC extends PaginatedActionBuilders<ABC>> = {
  [K in keyof PABC]: {
    getPaginationMonitor: (
      ...args: Parameters<PABC[K]>
    ) => PaginationMonitor<Y>;
    getPaginationService: (
      ...args: Parameters<PABC[K]>
    ) => PaginationObservables<Y>;
  }
};

/**
 * Provided a typed way to create entity monitor/service per action (this ultimately only provides ones for non-paginated actions)
 */
type EntityCatalogEntityStoreSingles<Y, ABC extends OrchestratedActionBuilders, SABC extends NonPaginatedActionBuilders<ABC>> = {
  [K in keyof SABC]: {
    getEntityMonitor: (
      startWithNull: boolean,
      ...args: Parameters<SABC[K]>
    ) => EntityMonitor<Y>;
    getEntityService: (
      ...args: Parameters<SABC[K]>
    ) => EntityService<Y>
  }
};

export type CustomEntityCatalogEntityStore<Y, ABC extends OrchestratedActionBuilders> =
  EntityCatalogEntityStoreCollections<Y, ABC, PaginatedActionBuilders<ABC>> &
  EntityCatalogEntityStoreSingles<Y, ABC, NonPaginatedActionBuilders<ABC>>


/**
 * Combine all types of store
 * - CoreEntityCatalogEntityStore (entity and entities store access)
 * - EntityCatalogEntityStoreCollections (per entity custom entities lists)
 * - EntityCatalogEntityStoreSingles (per entity custom entity's)
 */
export type EntityCatalogEntityStore<Y, ABC extends OrchestratedActionBuilders> =
  CoreEntityCatalogEntityStore<Y, ABC> &
  CustomEntityCatalogEntityStore<Y, ABC>



