import type { EnvironmentInjector, Injector, Type } from '@angular/core';
import type { Store } from '../types/action.types';
import type { Observable } from 'rxjs';

import type { HomePageEndpointCard } from '../../../core/src/features/home/home.types';
import type { IListAction } from '../../../core/src/shared/components/signal-list/list-action.types';
import type { GeneralEntityAppState } from '../app-state';
import type {
  ApiErrorMessageHandler,
  EntitiesFetchHandler,
  EntitiesInfoHandler,
  EntityFetchHandler,
  EntityInfoHandler,
  PaginationPageIteratorConfig,
  PreApiRequest,
  PrePaginationApiRequest,
  SuccessfulApiResponseDataMapper,
} from '../types/entity-pipeline.types';
import type { EndpointAuthTypeConfig } from '../extension-types';
import type { EntitySchema } from '../helpers/entity-schema';
import type { EndpointsDataService } from '../services/endpoints-data.service';
import type { EndpointModel } from '../types/endpoint.types';
import type { StratosStatus } from '../types/shared.types';
import type { UserFavorite } from '../types/user-favorites.types';
import type { UserFavoriteManager } from '../user-favorite-manager';

export interface EntityCatalogEntityConfig {
  entityType: string;
  endpointType: string;
  subType?: string;
  schemaKey?: string;
}

export interface ActionBuilderConfig<T extends Record<any, any> = Record<any, any>> {
  actionMetadata?: T;
  entityGuid: string;
  endpointGuid?: string;
}

export type EntityActionBuilderEntityConfig = EntityCatalogEntityConfig & ActionBuilderConfig;

export const extractEntityCatalogEntityConfig = (ecec: Partial<EntityCatalogEntityConfig>): EntityCatalogEntityConfig => {
  const { entityType, endpointType, subType, schemaKey } = ecec;
  // strict: callers always supply a config with entityType + endpointType; an absent one is a programming error
  if (entityType === undefined || endpointType === undefined) {
    throw new Error('extractEntityCatalogEntityConfig requires both entityType and endpointType');
  }
  return { entityType, endpointType, subType, schemaKey };
};

export interface EntityCatalogSchemas {
  default: EntitySchema;
  [schemaKey: string]: EntitySchema;
}
export interface IStratosEntityWithIcons {
  icon?: string;
  iconFont?: string;
  logoUrl?: string;
}

export interface IEntityMetadata {
  name: string;
  [key: string]: string;
}

export interface HomeCardShortcut {
  title: string;
  link: string[];
  icon: string;
  iconFont?: string;
}

// Metadata for Home Card
export interface HomeCardMetadata {
  component?: () => Promise<Type<HomePageEndpointCard>>;
  shortcuts?: (endpointID: string) => HomeCardShortcut[];
  fullView?: boolean;
  columnSpan?: number;
}

/**
 * Static information describing a base stratos entity.
 *
 * @export
 */
export interface IStratosBaseEntityDefinition<T = EntitySchema | EntityCatalogSchemas> extends IStratosEntityWithIcons {
  readonly type?: string;
  readonly schema: T;
  readonly label?: string;
  readonly labelShort?: string;
  readonly labelPlural?: string;
  readonly renderPriority?: number;
  /**
   * Show custom content in the endpoints list. Should be Type<EndpointListDetailsComponent>
   */
  readonly listDetailsComponent?: any;
  readonly parentType?: string;
  readonly subTypes?: Omit<IStratosBaseEntityDefinition, 'schema' | 'subTypes'>[];
  readonly paginationConfig?: PaginationPageIteratorConfig;
  readonly tableConfig?: EntityTableConfig<any>;
  readonly registrationComponent?: any;
  /**
   * Hook that will fire before an entity is emitted by an entity service. This could be used, for example, entity validation
   */
  readonly entityEmitHandler?: EntityInfoHandler;
  /**
   * Hook that will fire before an entity is emitted by an entity service. This could be used, for example, entity validation
   */
  readonly entitiesEmitHandler?: EntitiesInfoHandler;
  /**
   * Hook that can override the way an entity is fetched
   */
  readonly entityFetchHandler?: EntityFetchHandler;
  /**
   * Hook that can override the way entities are fetched
   */
  readonly entitiesFetchHandler?: EntitiesFetchHandler;
}

export class EndpointHealthCheck {
  /**
   * @param check To show an error, the check should either call a WrapperRequestActionFailed
   * or kick off a chain that eventually calls a WrapperRequestActionFailed
   */
  constructor(
    public endpointType: string,
    public check: (endpoint: EndpointModel) => void
  ) { }
}

/**
 * Static information describing a stratos endpoint.
 *
 * @export
 */
export interface IStratosEndpointDefinition<T = EntityCatalogSchemas | EntitySchema> extends IStratosBaseEntityDefinition<T> {
  readonly logoUrl: string;
  readonly tokenSharing?: boolean;
  readonly unConnectable?: boolean;
  /**
   * How many endpoints of this type can be registered, 0 - many
   */
  readonly registeredLimit?: (injector: Injector) => Observable<number> | number;
  /**
   * Indicates if this endpoint type is in tech preview and should only be shown when tech preview mode is enabled
   */
  readonly techPreview?: boolean;
  readonly urlValidationRegexString?: string;
  readonly authTypes: EndpointAuthTypeConfig[];
  readonly subTypes?: Omit<IStratosEndpointDefinition, 'schema' | 'subTypes'>[];

  /**
   * Allows an entity to manipulate the data that is returned from an api request before it makes it into the store.
   * This will be used for all entities with this endpoint type.
   */
  readonly globalSuccessfulRequestDataMapper?: SuccessfulApiResponseDataMapper;
  /**
   * Allows an entity to manipulate the request object before it's sent.
   * This will be used for all entities with this endpoint type unless the entity has it's own prerequest config.
   */
  readonly globalPreRequest?: PreApiRequest;
  readonly globalPrePaginationRequest?: PrePaginationApiRequest;
  readonly globalErrorMessageHandler?: ApiErrorMessageHandler;
  readonly healthCheck?: EndpointHealthCheck;
  // Used for favorites - given an entity, get the endpoint ID of the endpoint it belongs to
  readonly getEndpointIdFromEntity?: (entity: any) => string;
  readonly favoriteFromEntity?: <M extends IEntityMetadata = IEntityMetadata>(
    entity: any, entityKey: string, userFavoriteManager: UserFavoriteManager
  ) => UserFavorite<M>;
  /**
   * A list of actions that will be displayed in the endpoints lists
   * Note - These should be restricted by type
   */
  readonly endpointListActions?: (
    endpointsService: EndpointsDataService,
    injector: EnvironmentInjector,
  ) => IListAction<EndpointModel>[];

  /**
   * Metadata for the card to show on the Home Page for this endpoint type
   */
  readonly homeCard?: HomeCardMetadata;
}

export type StratosEndpointExtensionDefinition = Omit<IStratosEndpointDefinition, 'schema'>;
export interface EntityTableConfig<T = any> {
  rowBuilders: EntityRowBuilder<T>[];
  showHeader?: boolean;
}
/**
 * Static information describing a stratos entity.
 *
 * @export
 */
export interface IStratosEntityDefinition<
  T = EntitySchema | EntityCatalogSchemas,
  E = any,
  I = E
  > extends IStratosBaseEntityDefinition<T> {
  readonly endpoint: StratosEndpointExtensionDefinition;
  readonly subTypes?: Omit<IStratosEntityDefinition, 'schema' | 'subTypes' | 'endpoint'>[];
  // Allows an entity to manipulate the data that is returned from an api request before it makes it into the store.
  // This will override any globalSuccessfulRequestDataMapper found in the endpoint.
  // TODO We should wrap this and the global version with immer to make them immutable.
  readonly successfulRequestDataMapper?: SuccessfulApiResponseDataMapper<E, I> | 'false' | string;
  // Allows an entity to manipulate the request object before it's sent.
  // This will override any globalPreRequest found in the endpoint.
  readonly preRequest?: PreApiRequest;
  readonly prePaginationRequest?: PrePaginationApiRequest;
  readonly errorMessageHandler?: ApiErrorMessageHandler;
  // Should the request response object for this entity be parsed as if it's passed through the jetstream backend?
  readonly nonJetstreamRequest?: boolean;
  readonly nonJetstreamRequestHandler?: NonJetstreamRequestHandler;
}

export class NonJetstreamRequestHandler<T = any> {
  isSuccess!: (request: T) => boolean;
  getErrorCode?: (request: T) => string;
}

export interface IStratosEntityActions extends Partial<IStratosEntityWithIcons> {
  readonly label: string;
  readonly action: () => void;
  readonly actionable?: Observable<boolean>;
  readonly disabled?: Observable<boolean>;
}
export type EntityRowBuilder<T> = [string, (entity: T, store?: Store<GeneralEntityAppState>) => string | Observable<string>];

export interface IStratosEntityBuilder<T extends IEntityMetadata, Y = any> {
  getMetadata(entity: Y): T;
  // TODO This should be used in the entities schema.
  getGuid(entity: Y): string;
  getLink?(favorite: UserFavorite<T>): string | null;
  getSubTypeLabels?(entityMetadata: T): {
    singular: string,
    plural: string,
  };
  // Is the underlying entity for the favorite valid?
  getIsValid?(favorite: UserFavorite<T>): Observable<boolean>;
  /**
   * Actions that don't effect an individual entity i.e. create new
   * @returns global actions
   */
  getGlobalActions?(): IStratosEntityActions[];
  /**
   * Actions that effect on individual entity i.e. rename
   * @returns global actions
   */
  getActions?(entityMetadata: T): IStratosEntityActions[];
}

export interface IStratosEntityData<T extends IEntityMetadata = IEntityMetadata> {
  metadata: T;
  link: string;
  guid: string;
  lines: [string, string | Observable<string>][];
  actions?: IStratosEntityActions[];
  globalActions?: IStratosEntityActions[];
}

export interface IStratosEntityStatusData<Y extends IEntityMetadata = IEntityMetadata> extends IStratosEntityData<Y> {
  status$?: Observable<StratosStatus>;
}
