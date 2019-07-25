import { Store, ActionReducer, Action } from '@ngrx/store';

import { AppState, IRequestEntityTypeState } from '../../../../store/src/app-state';
import { EntitySchema } from '../../../../store/src/helpers/entity-schema';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { IEndpointFavMetadata } from '../../../../store/src/types/user-favorites.types';
import { endpointEntitySchema } from '../../base-entity-schemas';
import { getFullEndpointApiUrl } from '../../features/endpoints/endpoint-helpers';
import { EntityMonitor } from '../../shared/monitors/entity-monitor';
import { EntityActionDispatcherManager } from './action-dispatcher/action-dispatcher';
import { ActionOrchestrator, OrchestratedActionBuilders } from './action-orchestrator/action-orchestrator';
import { EntityCatalogueHelpers } from './entity-catalogue.helper';
import {
  EntityCatalogueSchemas,
  IEntityMetadata,
  IStratosBaseEntityDefinition,
  IStratosEndpointDefinition,
  StratosEndpointExtensionDefinition,
  IStratosEntityBuilder,
  IStratosEntityDefinition,
} from './entity-catalogue.types';
import { ApiRequestTypes } from '../../../../store/src/reducers/api-request-reducer/request-helpers';
import { NormalizedResponse } from '../../../../store/src/types/api.types';
import { normalize } from 'normalizr';

export interface EntityCatalogueBuilders<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  > {
  entityBuilder?: IStratosEntityBuilder<T, Y>;
  // Allows extensions to modify entities data in the store via none API Effect or unrelated actions.
  dataReducers?: ActionReducer<IRequestEntityTypeState<Y>>[];
  actionBuilders?: AB;
}
type DefinitionTypes = IStratosEntityDefinition<EntityCatalogueSchemas> |
  IStratosEndpointDefinition |
  IStratosBaseEntityDefinition<EntityCatalogueSchemas>;
export class StratosBaseCatalogueEntity<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  > {
  public readonly entityKey: string;
  public readonly type: string;
  public readonly definition: DefinitionTypes;
  public readonly isEndpoint: boolean;
  public readonly actionDispatchManager: EntityActionDispatcherManager<AB>;
  public readonly actionOrchestrator: ActionOrchestrator<AB>;
  constructor(
    definition: IStratosEntityDefinition | IStratosEndpointDefinition | IStratosBaseEntityDefinition,
    public readonly builders: EntityCatalogueBuilders<T, Y, AB> = {}
  ) {
    this.definition = this.populateEntity(definition);
    this.type = this.definition.type || this.definition.schema.default.entityType;
    const baseEntity = definition as IStratosEntityDefinition;
    this.isEndpoint = !baseEntity.endpoint;
    this.entityKey = this.isEndpoint ?
      EntityCatalogueHelpers.buildEntityKey(EntityCatalogueHelpers.endpointType, baseEntity.type) :
      EntityCatalogueHelpers.buildEntityKey(baseEntity.type, baseEntity.endpoint.type);
    this.actionOrchestrator = new ActionOrchestrator<AB>(this.entityKey, this.builders.actionBuilders);
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
    const catalogueSchema = this.definition.schema;
    if (!schemaKey || this.isEndpoint) {
      return catalogueSchema.default;
    }
    const entityCatalogue = this.definition as IStratosEntityDefinition;
    const tempId = EntityCatalogueHelpers.buildEntityKey(schemaKey, entityCatalogue.endpoint.type);
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

  public getEntityMonitor<Q extends AppState>(
    store: Store<Q>,
    entityId: string,
    {
      schemaKey = '',
      startWithNull = false
    } = {}
  ) {
    return new EntityMonitor(store, entityId, this.entityKey, this.getSchema(schemaKey), startWithNull);
  }

  public getTypeAndSubtype() {
    const type = this.definition.parentType || this.definition.type;
    const subType = this.definition.parentType ? this.definition.type : null;
    return {
      type,
      subType
    };
  }

  public getRequestAction(actionString: 'start' | 'success' | 'failure' | 'complete', requestType: ApiRequestTypes): Action {
    return {
      type: `@stratos/${this.entityKey}/${requestType}/${actionString}`
    };
  }

  public getNormalizedEntityData(entities: Y | Y[], schemaKey?: string): NormalizedResponse<Y> {
    const schema = this.getSchema(schemaKey);
    if (Array.isArray(entities)) {
      return normalize(entities, [schema]);
    }
    return normalize(entities, schema);
  }

}

export class StratosCatalogueEntity<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  > extends StratosBaseCatalogueEntity<T, Y, AB> {
  public definition: IStratosEntityDefinition<EntityCatalogueSchemas, Y>;
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
    getLines: metadata => [
      ['Address', metadata.address],
      ['User', metadata.user],
      ['Admin', metadata.admin]
    ]
  } as IStratosEntityBuilder<IEndpointFavMetadata, EndpointModel>;
  // This is needed here for typing
  public definition: IStratosEndpointDefinition;
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
        ...StratosCatalogueEndpointEntity.baseEndpointRender,
        getLink: getLink || StratosCatalogueEndpointEntity.baseEndpointRender.getLink
      }
    });
  }
}
