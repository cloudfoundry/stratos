import { ActionReducer } from '@ngrx/store';

import { endpointEntitySchema, STRATOS_ENDPOINT_TYPE } from '../../../../core/src/base-entity-schemas';
import { KnownKeys, NonOptionalKeys } from '../../../../core/src/core/utils.service';
import { getFullEndpointApiUrl } from '../../../../core/src/features/endpoints/endpoint-helpers';
import { IRequestEntityTypeState } from '../../app-state';
import {
  EntitiesFetchHandler,
  EntitiesInfoHandler,
  EntityFetchHandler,
  EntityInfoHandler,
} from '../../entity-request-pipeline/entity-request-pipeline.types';
import {
  PaginationPageIteratorConfig,
} from '../../entity-request-pipeline/pagination-request-base-handlers/pagination-iterator.pipe';
import { EntityPipelineEntity, stratosEndpointGuidKey } from '../../entity-request-pipeline/pipeline.types';
import { EntitySchema } from '../../helpers/entity-schema';
import { EndpointModel } from '../../types/endpoint.types';
import { APISuccessOrFailedAction, EntityRequestAction } from '../../types/request.types';
import { IEndpointFavMetadata } from '../../types/user-favorites.types';
import {
  ActionBuilderAction,
  ActionOrchestrator,
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
} from '../action-orchestrator/action-orchestrator';
import { EntityCatalogHelpers } from '../entity-catalog.helper';
import {
  EntityCatalogSchemas,
  IEntityMetadata,
  IStratosBaseEntityDefinition,
  IStratosEndpointDefinition,
  IStratosEntityBuilder,
  IStratosEntityDefinition,
  StratosEndpointExtensionDefinition,
} from '../entity-catalog.types';
import { ActionBuilderConfigMapper } from './action-builder-config.mapper';
import { ActionDispatchers, EntityCatalogEntityStoreHelpers } from './entity-catalog-entity-store-helpers';
import { EntityCatalogEntityStore } from './entity-catalog-entity.types';

export type KnownActionBuilders<ABC extends OrchestratedActionBuilders> = Pick<ABC, NonOptionalKeys<Pick<ABC, KnownKeys<ABC>>>>

export interface EntityCatalogBuilders<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilderConfig = OrchestratedActionBuilders,
  > {
  entityBuilder?: IStratosEntityBuilder<T, Y>;
  // Allows extensions to modify entities data in the store via none API Effect or unrelated actions.
  dataReducers?: ActionReducer<IRequestEntityTypeState<Y>>[];
  actionBuilders?: AB;
}
type DefinitionTypes = IStratosEntityDefinition<EntityCatalogSchemas> |
  IStratosEndpointDefinition<EntityCatalogSchemas> |
  IStratosBaseEntityDefinition<EntityCatalogSchemas>;
export class StratosBaseCatalogEntity<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilderConfig = OrchestratedActionBuilderConfig,
  // This typing may cause an issue down the line.
  ABC extends OrchestratedActionBuilders = AB extends OrchestratedActionBuilders ? AB : OrchestratedActionBuilders,
  > {

  constructor(
    definition: IStratosEntityDefinition | IStratosEndpointDefinition | IStratosBaseEntityDefinition,
    public readonly builders: EntityCatalogBuilders<T, Y, AB> = {}
  ) {
    this.definition = this.populateEntity(definition);
    this.type = this.definition.type || this.definition.schema.default.entityType;
    const baseEntity = definition as IStratosEntityDefinition;
    this.isEndpoint = !baseEntity.endpoint;
    this.endpointType = this.getEndpointType(baseEntity);
    // Note - Replacing `buildEntityKey` with `entityCatalog.getEntityKey` will cause circular dependency
    this.entityKey = this.isEndpoint ?
      EntityCatalogHelpers.buildEntityKey(EntityCatalogHelpers.endpointType, baseEntity.type) :
      EntityCatalogHelpers.buildEntityKey(baseEntity.type, baseEntity.endpoint.type);
    const actionBuilders = ActionBuilderConfigMapper.getActionBuilders(
      this.builders.actionBuilders,
      this.endpointType,
      this.type,
      (schemaKey: string) => this.getSchema(schemaKey)
    );

    this.actions = actionBuilders as KnownActionBuilders<ABC>;

    this.actionOrchestrator = new ActionOrchestrator<ABC>(this.entityKey, actionBuilders as ABC);

    this.store = {
      ...EntityCatalogEntityStoreHelpers.createCoreStore<Y, ABC>(
        this.actionOrchestrator,
        this.entityKey,
        (schemaKey: string) => this.getSchema(schemaKey)
      ),
      ...EntityCatalogEntityStoreHelpers.getPaginationStore<Y, ABC>(
        this.actions,
        this.entityKey,
        (schemaKey: string) => this.getSchema(schemaKey)
      )
    };
    this.api = EntityCatalogEntityStoreHelpers.getActionDispatchers<Y, ABC>(
      this.store,
      actionBuilders as ABC
    );
  }


  /**
   * Create actions specific to the entity type
   */
  public readonly actions: KnownActionBuilders<ABC>;
  /**
   * Create and dispatch actions specific to the entity type. Response will provide an observable reporting entity or pagination state
   */
  public readonly api: ActionDispatchers<KnownActionBuilders<ABC>>;
  /**
   * Monitor an entity or collection of entities. Services will fetch the entity/entities if missing, monitors will not
   */
  public readonly store: EntityCatalogEntityStore<Y, ABC>;


  public readonly entityKey: string;
  public readonly type: string;
  public readonly definition: DefinitionTypes;
  public readonly isEndpoint: boolean;
  public readonly actionOrchestrator: ActionOrchestrator<ABC>;
  public readonly endpointType: string;

  private populateEntitySchemaKey(entitySchemas: EntityCatalogSchemas): EntityCatalogSchemas {
    return Object.keys(entitySchemas).reduce((newSchema, schemaKey) => {
      if (schemaKey !== 'default') {
        // New schema must be instance of `schema.Entity` (and not a spread of one) else normalize will ignore
        newSchema[schemaKey] = entitySchemas[schemaKey].clone();
        newSchema[schemaKey].schemaKey = schemaKey;
      }
      return newSchema;
    }, {
        default: entitySchemas.default
      });
  }

  private getEndpointType(definition: IStratosBaseEntityDefinition) {
    const entityDef = definition as IStratosEntityDefinition;
    return entityDef.endpoint ? entityDef.endpoint.type : STRATOS_ENDPOINT_TYPE;
  }

  private populateEntity(entity: IStratosEntityDefinition | IStratosEndpointDefinition | IStratosBaseEntityDefinition)
    : DefinitionTypes {
    // For cases where `entity.schema` is a EntityCatalogSchemas just pass original object through (with it's default)
    const entitySchemas = entity.schema instanceof EntitySchema ? {
      default: entity.schema
    } : this.populateEntitySchemaKey(entity.schema);

    return {
      ...entity,
      type: entity.type || entitySchemas.default.entityType,
      label: entity.label || 'Unknown',
      labelPlural: entity.labelPlural || entity.label || 'Unknown',
      schema: entitySchemas
    };
  }
  /**
   * Gets the schema associated with the entity type.
   * If no schemaKey is provided then the default schema will be returned
   */
  public getSchema(schemaKey?: string) {
    const catalogSchema = this.definition.schema as EntityCatalogSchemas;
    if (!schemaKey || this.isEndpoint) {
      return catalogSchema.default;
    }
    const entityDefinition = this.definition as IStratosEntityDefinition;
    // Note - Replacing `buildEntityKey` with `entityCatalog.getEntityKey` will cause circular dependency
    const tempId = EntityCatalogHelpers.buildEntityKey(schemaKey, entityDefinition.endpoint.type);
    if (!catalogSchema[schemaKey] && tempId === this.entityKey) {
      // We've requested the default by passing the schema key that matches the entity type
      return catalogSchema.default;
    }
    return catalogSchema[schemaKey];
  }

  public getGuidFromEntity(entity: Y) {
    if (!this.builders.entityBuilder || !this.builders.entityBuilder.getGuid || !this.builders.entityBuilder.getMetadata) {
      return null;
    }
    const metadata = this.builders.entityBuilder.getMetadata(entity);
    return this.builders.entityBuilder.getGuid(metadata);
  }

  public getEndpointGuidFromEntity(entity: Y & EntityPipelineEntity) {
    return entity[stratosEndpointGuidKey];
  }

  public getTypeAndSubtype() {
    const type = this.definition.parentType || this.definition.type;
    const subType = this.definition.parentType ? this.definition.type : null;
    return {
      type,
      subType
    };
  }
  // Backward compatibility with the old actions.
  // This should be removed after everything is based on the new flow
  private getLegacyTypeFromAction(
    action: EntityRequestAction,
    actionString: 'start' | 'success' | 'failure' | 'complete'
  ) {
    if (action && action.actions) {
      switch (actionString) {
        case 'success':
          return action.actions[1];
        case 'failure':
          return action.actions[2];
        case 'start':
          return action.actions[0];
      }
    }
    return null;
  }

  private getTypeFromAction(action?: EntityRequestAction) {
    if (action) {
      const actionBuilderAction = action as ActionBuilderAction;
      return actionBuilderAction.actionBuilderActionType || null;
    }
    return null;
  }

  public getRequestType(
    actionString: 'start' | 'success' | 'failure' | 'complete',
    actionOrActionBuilderKey?: EntityRequestAction | string,
    requestType: string = 'request'
  ) {
    const requestTypeLabel = typeof actionOrActionBuilderKey === 'string' ?
      actionOrActionBuilderKey :
      this.getTypeFromAction(actionOrActionBuilderKey) || requestType;
    return `@stratos/${this.entityKey}/${requestTypeLabel}/${actionString}`;
  }

  public getRequestAction(
    actionString: 'start' | 'success' | 'failure' | 'complete',
    actionOrActionBuilderKey?: EntityRequestAction | string,
    requestType?: string,
    response?: any
  ): APISuccessOrFailedAction {
    if (typeof actionOrActionBuilderKey === 'string') {
      return new APISuccessOrFailedAction(this.getRequestType(actionString, actionOrActionBuilderKey), null, response);
    }
    const type =
      this.getLegacyTypeFromAction(actionOrActionBuilderKey, actionString) ||
      this.getRequestType(actionString, actionOrActionBuilderKey, requestType);
    return new APISuccessOrFailedAction(type, actionOrActionBuilderKey, response);

  }

  public getPaginationConfig(): PaginationPageIteratorConfig {
    return this.definition.paginationConfig ?
      this.definition.paginationConfig :
      null;
  }

  public getEntityEmitHandler(): EntityInfoHandler {
    return this.definition.entityEmitHandler;
  }

  public getEntitiesEmitHandler(): EntitiesInfoHandler {
    return this.definition.entitiesEmitHandler;
  }

  public getEntityFetchHandler(): EntityFetchHandler {
    return this.definition.entityFetchHandler;
  }

  public getEntitiesFetchHandler(): EntitiesFetchHandler {
    return this.definition.entitiesFetchHandler;
  }
}

export class StratosCatalogEntity<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilderConfig = OrchestratedActionBuilders,
  ABC extends OrchestratedActionBuilders = AB extends OrchestratedActionBuilders ? AB : OrchestratedActionBuilders,
  > extends StratosBaseCatalogEntity<T, Y, AB, ABC> {
  public definition: IStratosEntityDefinition<EntityCatalogSchemas, Y, ABC>;
  constructor(
    entity: IStratosEntityDefinition,
    config?: EntityCatalogBuilders<T, Y, AB>
  ) {
    super(entity, config);
  }

  public getPaginationConfig(): PaginationPageIteratorConfig {
    return this.definition.paginationConfig ?
      this.definition.paginationConfig :
      this.definition.endpoint ? this.definition.endpoint.paginationConfig : null;
  }

  public getEntityEmitHandler(): EntityInfoHandler {
    return this.definition.entityEmitHandler ||
      this.definition.endpoint ? this.definition.endpoint.entityEmitHandler : null;
  }

  public getEntitiesEmitHandler(): EntitiesInfoHandler {
    return this.definition.entitiesEmitHandler ||
      this.definition.endpoint ? this.definition.endpoint.entitiesEmitHandler : null
  }

  public getEntityFetchHandler(): EntityFetchHandler {
    return this.definition.entityFetchHandler ||
      this.definition.endpoint ? this.definition.endpoint.entityFetchHandler : null;
  }

  public getEntitiesFetchHandler(): EntitiesFetchHandler {
    return this.definition.entitiesFetchHandler ||
      this.definition.endpoint ? this.definition.endpoint.entitiesFetchHandler : null;
  }
}

export class StratosCatalogEndpointEntity extends StratosBaseCatalogEntity<IEndpointFavMetadata, EndpointModel> {
  static readonly baseEndpointRender = {
    getMetadata: endpoint => ({
      name: endpoint.name,
      guid: endpoint.guid,
      address: getFullEndpointApiUrl(endpoint),
      user: endpoint.user ? endpoint.user.name : undefined,
      subType: endpoint.sub_type,
      admin: endpoint.user ? endpoint.user.admin ? 'Yes' : 'No' : undefined
    }),
    getLink: () => null,
    getGuid: metadata => metadata.guid,
    getLines: () => [
      ['Address', (metadata) => metadata.address],
      ['User', (metadata) => metadata.user],
      ['Admin', (metadata) => metadata.admin]
    ]
  } as IStratosEntityBuilder<IEndpointFavMetadata, EndpointModel>;
  // This is needed here for typing
  public definition: IStratosEndpointDefinition<EntityCatalogSchemas>;
  constructor(
    entity: StratosEndpointExtensionDefinition | IStratosEndpointDefinition,
    getLink?: (metadata: IEndpointFavMetadata) => string
  ) {
    const fullEntity = {
      ...entity,
      schema: {
        default: endpointEntitySchema
      }
    } as IStratosEndpointDefinition;
    super(fullEntity, {
      entityBuilder: {
        ...StratosCatalogEndpointEntity.baseEndpointRender,
        getLink: getLink || StratosCatalogEndpointEntity.baseEndpointRender.getLink
      }
    });
  }
}

