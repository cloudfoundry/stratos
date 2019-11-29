import { ActionReducer, Store } from '@ngrx/store';

import { AppState, IRequestEntityTypeState } from '../../../../store/src/app-state';
import { EntityPipelineEntity, stratosEndpointGuidKey } from '../../../../store/src/entity-request-pipeline/pipeline.types';
import { EntitySchema } from '../../../../store/src/helpers/entity-schema';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { APISuccessOrFailedAction, EntityRequestAction } from '../../../../store/src/types/request.types';
import { IEndpointFavMetadata } from '../../../../store/src/types/user-favorites.types';
import { endpointEntitySchema, STRATOS_ENDPOINT_TYPE } from '../../base-entity-schemas';
import { getFullEndpointApiUrl } from '../../features/endpoints/endpoint-helpers';
import { EntityMonitor } from '../../shared/monitors/entity-monitor';
import { ActionBuilderConfigMapper } from './action-builder-config.mapper';
import { EntityActionDispatcherManager } from './action-dispatcher/action-dispatcher';
import {
  ActionBuilderAction,
  ActionOrchestrator,
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
} from './action-orchestrator/action-orchestrator';
import { EntityCatalogueHelpers } from './entity-catalogue.helper';
import {
  EntityCatalogueSchemas,
  IEntityMetadata,
  IStratosBaseEntityDefinition,
  IStratosEndpointDefinition,
  IStratosEntityBuilder,
  IStratosEntityDefinition,
  StratosEndpointExtensionDefinition,
} from './entity-catalogue.types';

export interface EntityCatalogueBuilders<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilderConfig = OrchestratedActionBuilders
  > {
  entityBuilder?: IStratosEntityBuilder<T, Y>;
  // Allows extensions to modify entities data in the store via none API Effect or unrelated actions.
  dataReducers?: ActionReducer<IRequestEntityTypeState<Y>>[];
  actionBuilders?: AB;
}
type DefinitionTypes = IStratosEntityDefinition<EntityCatalogueSchemas> |
  IStratosEndpointDefinition<EntityCatalogueSchemas> |
  IStratosBaseEntityDefinition<EntityCatalogueSchemas>;
export class StratosBaseCatalogueEntity<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilderConfig = OrchestratedActionBuilderConfig,
  // This typing may cause an issue down the line.
  ABC extends OrchestratedActionBuilders = AB extends OrchestratedActionBuilders ? AB : OrchestratedActionBuilders
  > {
  public readonly entityKey: string;
  public readonly type: string;
  public readonly definition: DefinitionTypes;
  public readonly isEndpoint: boolean;
  public readonly actionDispatchManager: EntityActionDispatcherManager<ABC>;
  public readonly actionOrchestrator: ActionOrchestrator<ABC>;
  public readonly endpointType: string;
  constructor(
    definition: IStratosEntityDefinition | IStratosEndpointDefinition | IStratosBaseEntityDefinition,
    public readonly builders: EntityCatalogueBuilders<T, Y, AB> = {}
  ) {
    this.definition = this.populateEntity(definition);
    this.type = this.definition.type || this.definition.schema.default.entityType;
    const baseEntity = definition as IStratosEntityDefinition;
    this.isEndpoint = !baseEntity.endpoint;
    this.endpointType = this.getEndpointType(baseEntity);
    // Note - Replacing `buildEntityKey` with `entityCatalogue.getEntityKey` will cause circular dependency
    this.entityKey = this.isEndpoint ?
      EntityCatalogueHelpers.buildEntityKey(EntityCatalogueHelpers.endpointType, baseEntity.type) :
      EntityCatalogueHelpers.buildEntityKey(baseEntity.type, baseEntity.endpoint.type);
    const actionBuilders = ActionBuilderConfigMapper.getActionBuilders(
      this.builders.actionBuilders,
      this.endpointType,
      this.type,
      (schemaKey: string) => this.getSchema(schemaKey)
    );
    this.actionOrchestrator = new ActionOrchestrator<ABC>(this.entityKey, actionBuilders as ABC);
    this.actionDispatchManager = this.actionOrchestrator.getEntityActionDispatcher();
  }

  private populateEntitySchemaKey(entitySchemas: EntityCatalogueSchemas): EntityCatalogueSchemas {
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
    // For cases where `entity.schema` is a EntityCatalogueSchemas just pass original object through (with it's default)
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
    const catalogueSchema = this.definition.schema as EntityCatalogueSchemas;
    if (!schemaKey || this.isEndpoint) {
      return catalogueSchema.default;
    }
    const entityDefinition = this.definition as IStratosEntityDefinition;
    // Note - Replacing `buildEntityKey` with `entityCatalogue.getEntityKey` will cause circular dependency
    const tempId = EntityCatalogueHelpers.buildEntityKey(schemaKey, entityDefinition.endpoint.type);
    if (!catalogueSchema[schemaKey] && tempId === this.entityKey) {
      // We've requested the default by passing the schema key that matches the entity type
      return catalogueSchema.default;
    }
    return catalogueSchema[schemaKey];
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

  public getEntityMonitor<Q extends AppState, B = any>(
    store: Store<Q>,
    entityId: string,
    {
      schemaKey = '',
      startWithNull = false
    } = {}
  ) {
    return new EntityMonitor<B>(store, entityId, this.entityKey, this.getSchema(schemaKey), startWithNull);
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

}

export class StratosCatalogueEntity<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilderConfig = OrchestratedActionBuilders,
  ABC extends OrchestratedActionBuilders = AB extends OrchestratedActionBuilders ? AB : OrchestratedActionBuilders
  > extends StratosBaseCatalogueEntity<T, Y, AB> {
  public definition: IStratosEntityDefinition<EntityCatalogueSchemas, Y, ABC>;
  constructor(
    entity: IStratosEntityDefinition,
    config?: EntityCatalogueBuilders<T, Y, AB>
  ) {
    super(entity, config);
  }
}

export class StratosCatalogueEndpointEntity extends StratosBaseCatalogueEntity<IEndpointFavMetadata, EndpointModel> {
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
  public definition: IStratosEndpointDefinition<EntityCatalogueSchemas>;
  constructor(
    entity: StratosEndpointExtensionDefinition | IStratosEndpointDefinition,
    getLink?: (metadata: IEndpointFavMetadata) => string,
    // TODO: attach to PreviewableComponent
    getPreviewableComponent?: () => object
  ) {
    const fullEntity = {
      ...entity,
      schema: {
        default: endpointEntitySchema
      }
    } as IStratosEndpointDefinition;
    super(fullEntity, {
      entityBuilder: {
        ...StratosCatalogueEndpointEntity.baseEndpointRender,
        getLink: getLink || StratosCatalogueEndpointEntity.baseEndpointRender.getLink,
        getPreviewableComponent,
      }
    });
  }
}
