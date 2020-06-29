import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { GeneralEntityAppState } from '../app-state';
import {
  ApiErrorMessageHandler,
  EntitiesFetchHandler,
  EntitiesInfoHandler,
  EntityFetchHandler,
  EntityInfoHandler,
  EntityUserRolesFetch,
  EntityUserRolesReducer,
  PreApiRequest,
  PrePaginationApiRequest,
  SuccessfulApiResponseDataMapper,
} from '../entity-request-pipeline/entity-request-pipeline.types';
import {
  PaginationPageIteratorConfig,
} from '../entity-request-pipeline/pagination-request-base-handlers/pagination-iterator.pipe';
import { EndpointAuthTypeConfig } from '../extension-types';
import { FavoritesConfigMapper } from '../favorite-config-mapper';
import { EntitySchema } from '../helpers/entity-schema';
import { EndpointModel } from '../types/endpoint.types';
import { StratosStatus } from '../types/shared.types';
import { UserFavorite } from '../types/user-favorites.types';

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
  return { entityType, endpointType, subType, schemaKey };
};

export interface EntityCatalogSchemas {
  default: EntitySchema;
  [schemaKey: string]: EntitySchema;
}
export interface IStratosEntityWithIcons {
  icon?: string;
  iconFont?: string;
}

export interface IEntityMetadata {
  name: string;
  [key: string]: string;
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
  readonly urlValidation?: boolean;
  readonly unConnectable?: boolean;
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
  readonly favoriteFromEntity?: <M extends IEntityMetadata = IEntityMetadata>(
    entity: any, entityKey: string, favoritesConfigMapper: FavoritesConfigMapper
  ) => UserFavorite<M>;
  /**
   * Allows the endpoint to fetch user roles, for example when the user loads Stratos or connects an endpoint of this type
   */
  readonly userRolesFetch?: EntityUserRolesFetch
  /**
   * Allows the user roles to be stored, updated and removed in the current user permissions section of the store
   */
  readonly userRolesReducer?: EntityUserRolesReducer
}

export interface StratosEndpointExtensionDefinition extends Omit<IStratosEndpointDefinition, 'schema'> { }
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
  isSuccess: (request: T) => boolean;
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
  getStatusObservable?(entity: Y): Observable<StratosStatus>;
  // TODO This should be used in the entities schema.
  getGuid(entityMetadata: T): string;
  getLink?(entityMetadata: T): string;
  getLines?(): EntityRowBuilder<T>[];
  getSubTypeLabels?(entityMetadata: T): {
    singular: string,
    plural: string
  };
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
