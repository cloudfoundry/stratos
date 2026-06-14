import type { ActionReducer } from '../../types/action.types';

import type { IRequestEntityTypeState } from '../../app-state';
import type {
  EntitiesFetchHandler,
  EntitiesInfoHandler,
  EntityFetchHandler,
  EntityInfoHandler,
  EntityPipelineEntity,
  PaginationPageIteratorConfig,
} from '../../types/entity-pipeline.types';
import { stratosEndpointGuidKey } from '../../types/entity-pipeline.types';
import type { EndpointAuthTypeConfig } from '../../extension-types';
import { EntitySchema } from '../../helpers/entity-schema';
import { endpointEntityType, STRATOS_ENDPOINT_TYPE, stratosEntityFactory } from '../../helpers/stratos-entity-factory';
import type { EndpointModel } from '../../types/endpoint.types';
import { APISuccessOrFailedAction } from '../../types/request.types';
import type { EntityRequestAction } from '../../types/request.types';
import type { IEndpointFavMetadata, UserFavorite } from '../../types/user-favorites.types';
import {
  ActionBuilderAction,
  ActionOrchestrator,
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
} from '../action-orchestrator/action-orchestrator';
import { EntityCatalogHelpers } from '../entity-catalog.helper';
import type {
  EntityCatalogSchemas,
  IEntityMetadata,
  IStratosBaseEntityDefinition,
  IStratosEndpointDefinition,
  IStratosEntityBuilder,
  IStratosEntityDefinition,
  StratosEndpointExtensionDefinition,
} from '../entity-catalog.types';
import { ActionBuilderConfigMapper } from './action-builder-config.mapper';
import type { NonOptionalKeys, RemoveIndex } from './type.helpers';

export type KnownActionBuilders<ABC extends OrchestratedActionBuilders> = Pick<
  ABC,
  NonOptionalKeys<RemoveIndex<ABC>>
>;

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
    // populateEntity always sets `type` (falls back to schema.default.entityType), so it is present here
    this.type = this.definition.type || this.definition.schema.default.entityType;
    const baseEntity = definition as IStratosEntityDefinition;
    this.isEndpoint = !baseEntity.endpoint;
    this.endpointType = this.getEndpointType(baseEntity);
    // strict: definitions registered with the catalog always declare a `type`; resolve from the
    // populated definition (which backfills from schema.default.entityType) to keep the key stable
    const baseEntityType = baseEntity.type ?? this.type;
    // Note - Replacing `buildEntityKey` with `entityCatalog.getEntityKey` will cause circular dependency
    this.entityKey = this.isEndpoint ?
      EntityCatalogHelpers.buildEntityKey(EntityCatalogHelpers.endpointType, baseEntityType) :
      // strict: non-endpoint entities always have an endpoint with a type set
      EntityCatalogHelpers.buildEntityKey(baseEntityType, baseEntity.endpoint.type ?? this.endpointType);
    const actionBuilders = ActionBuilderConfigMapper.getActionBuilders(
      this.builders.actionBuilders ?? {},
      this.endpointType,
      this.type,
      (schemaKey: string) => this.getSchema(schemaKey)
    );

    this.actions = actionBuilders as KnownActionBuilders<ABC>;

    this.actionOrchestrator = new ActionOrchestrator<ABC>(this.entityKey, actionBuilders as ABC);
  }


  /**
   * Create actions specific to the entity type
   */
  public readonly actions: KnownActionBuilders<ABC>;

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
    } as EntityCatalogSchemas);
  }

  private getEndpointType(definition: IStratosBaseEntityDefinition): string {
    const entityDef = definition as IStratosEntityDefinition;
    // strict: a non-endpoint entity always has an endpoint with a declared type; fall back defensively
    return entityDef.endpoint ? (entityDef.endpoint.type ?? STRATOS_ENDPOINT_TYPE) : STRATOS_ENDPOINT_TYPE;
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
    // strict: an entity definition (non-endpoint) always has an endpoint with a declared type
    const tempId = EntityCatalogHelpers.buildEntityKey(schemaKey, entityDefinition.endpoint.type ?? this.endpointType);
    if (!catalogSchema[schemaKey] && tempId === this.entityKey) {
      // We've requested the default by passing the schema key that matches the entity type
      return catalogSchema.default;
    }
    return catalogSchema[schemaKey];
  }

  public getGuidFromEntity(entity: Y) {
    if (this.builders.entityBuilder && this.builders.entityBuilder.getGuid) {
      // Builders typically read `entity.metadata.guid` (CF v2 shape) or
      // `entity.guid` (v3). Partial / mid-hydration entities may be missing
      // the nested key, which throws inside the builder. Catch defensively
      // — callers handle null by falling back to an outer guid (see
      // mapMultiEndpointResponses) or skipping the row.
      try {
        return this.builders.entityBuilder.getGuid(entity);
      } catch {
        return null;
      }
    }
    return null;
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
    action: EntityRequestAction | undefined,
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
      // The string-key path has no originating action object; apiAction is left undefined
      return new APISuccessOrFailedAction(this.getRequestType(actionString, actionOrActionBuilderKey), undefined, response);
    }
    const type =
      this.getLegacyTypeFromAction(actionOrActionBuilderKey, actionString) ||
      this.getRequestType(actionString, actionOrActionBuilderKey, requestType);
    // apiAction is optional; the non-string branch passes the action object (or undefined
    // if the optional arg was omitted), mirroring the string-key path above.
    return new APISuccessOrFailedAction(type, actionOrActionBuilderKey, response);

  }

  public getPaginationConfig(): PaginationPageIteratorConfig | null {
    return this.definition.paginationConfig ?
      this.definition.paginationConfig :
      null;
  }

  public getEntityEmitHandler(): EntityInfoHandler | undefined {
    return this.definition.entityEmitHandler;
  }

  public getEntitiesEmitHandler(): EntitiesInfoHandler | undefined {
    return this.definition.entitiesEmitHandler;
  }

  public getEntityFetchHandler(): EntityFetchHandler | undefined {
    return this.definition.entityFetchHandler;
  }

  public getEntitiesFetchHandler(): EntitiesFetchHandler | undefined {
    return this.definition.entitiesFetchHandler;
  }
}

export class StratosCatalogEntity<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilderConfig = OrchestratedActionBuilders,
  ABC extends OrchestratedActionBuilders = AB extends OrchestratedActionBuilders ? AB : OrchestratedActionBuilders,
  > extends StratosBaseCatalogEntity<T, Y, AB, ABC> {
  public declare definition: IStratosEntityDefinition<EntityCatalogSchemas, Y, ABC>;
  constructor(
    entity: IStratosEntityDefinition,
    config?: EntityCatalogBuilders<T, Y, AB>
  ) {
    super(entity, config);
  }

  public getPaginationConfig(): PaginationPageIteratorConfig | null {
    return this.definition.paginationConfig ?
      this.definition.paginationConfig :
      this.definition.endpoint ? this.definition.endpoint.paginationConfig ?? null : null;
  }

  public getEntityEmitHandler(): EntityInfoHandler | undefined {
    return this.definition.entityEmitHandler ||
      this.definition.endpoint ? this.definition.endpoint.entityEmitHandler : undefined;
  }

  public getEntitiesEmitHandler(): EntitiesInfoHandler | undefined {
    return this.definition.entitiesEmitHandler ||
      this.definition.endpoint ? this.definition.endpoint.entitiesEmitHandler : undefined;
  }

  public getEntityFetchHandler(): EntityFetchHandler | undefined {
    return this.definition.entityFetchHandler ||
      this.definition.endpoint ? this.definition.endpoint.entityFetchHandler : undefined;
  }

  public getEntitiesFetchHandler(): EntitiesFetchHandler | undefined {
    return this.definition.entitiesFetchHandler ||
      this.definition.endpoint ? this.definition.endpoint.entitiesFetchHandler : undefined;
  }
}

export class StratosCatalogEndpointEntity extends StratosBaseCatalogEntity<IEndpointFavMetadata, EndpointModel> {
  static readonly baseEndpointRender: IStratosEntityBuilder<IEndpointFavMetadata, EndpointModel> = {
    getMetadata: endpoint => ({
      name: endpoint.name,
      // sub_type is optional on EndpointModel; an absent sub-type maps to no sub-type
      subType: endpoint.sub_type ?? '',
    }),
    getLink: () => null,
    // strict: getGuid receives the EndpointModel (Y); guid is optional on the model but a
    // registered endpoint entity always has one by the time a favorite/builder runs.
    getGuid: endpoint => endpoint.guid!,
  };
  // This is needed here for typing
  public declare definition: IStratosEndpointDefinition<EntityCatalogSchemas>;
  constructor(
    entity: StratosEndpointExtensionDefinition | IStratosEndpointDefinition,
    getLink?: (favorite: UserFavorite<IEndpointFavMetadata>) => string
  ) {
    // For endpoint entities, preserve the endpoint type in the 'type' property
    // This is used by the entity catalog to identify the endpoint type (e.g., 'cf', 'metrics')
    // The schema's entityType will be 'endpoint' for all endpoint entities
    //
    // CRITICAL: Must exclude 'endpoint' property when spreading to ensure isEndpoint=true
    // In StratosBaseCatalogEntity constructor, isEndpoint = !baseEntity.endpoint (line 76)
    // If 'endpoint' property exists, the entity will be registered in the entities map
    // instead of the endpoints map, breaking endpoint entity lookups
    const { endpoint: _, ...entityWithoutEndpoint } = entity as any;
    const fullEntity: IStratosEndpointDefinition = {
      ...entityWithoutEndpoint,
      schema: {
        default: stratosEntityFactory(endpointEntityType)
      }
    };
    super(fullEntity, {
      entityBuilder: {
        ...StratosCatalogEndpointEntity.baseEndpointRender,
        getLink: getLink || StratosCatalogEndpointEntity.baseEndpointRender.getLink
      }
    });
  }

  public setListComponent(component: any) {
    // Can only be set once
    if (!this.definition.listDetailsComponent) {
      (this.definition as any).listDetailsComponent = component;
    }
  }

  public setAuthTypes(authTypes: EndpointAuthTypeConfig[]) {
    // Can only be set once
    if (!this.definition.authTypes || this.definition.authTypes.length === 0) {
      (this.definition as any).authTypes = authTypes;
    }
  }

}

