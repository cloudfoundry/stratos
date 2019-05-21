import {
  IEntityMetadata,
  IStratosEntityDefinition,
  EntityCatalogueSchemas,
  IStratosEndpointDefinition,
  IStratosEntityBuilder,
  IStratosEndpointWithoutSchemaDefinition
} from './entity-catalogue.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/src/app-state';
import { EntityCatalogueHelpers } from './entity-catalogue.helper';
import { IEndpointFavMetadata } from '../../../../store/src/types/user-favorites.types';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { getFullEndpointApiUrl } from '../../features/endpoints/endpoint-helpers';
import { endpointEntitySchema } from '../../base-entity-schemas';
import { EntitySchema } from '../../../../store/src/helpers/entity-schema';
import { EntityMonitor } from '../../shared/monitors/entity-monitor';
import { PaginationMonitor } from '../../shared/monitors/pagination-monitor';

export class StratosBaseCatalogueEntity<T extends IEntityMetadata = IEntityMetadata, Y = any> {
  public readonly entityKey: string;
  public readonly entity: IStratosEntityDefinition<EntityCatalogueSchemas> | IStratosEndpointDefinition;
  public readonly isEndpoint: boolean;
  // TODO we should do some typing magic to hide this from extensions - nj
  public readonly isStratosType: boolean;
  public readonly hasBuilder: boolean;
  private store: Store<AppState>;
  constructor(
    entity: IStratosEntityDefinition | IStratosEndpointDefinition,
    public builder?: IStratosEntityBuilder<T, Y>
  ) {
    this.entity = this.populateEntity(entity);
    const baseEntity = entity as IStratosEntityDefinition;
    this.isEndpoint = !this.isStratosType && !baseEntity.endpoint;
    this.hasBuilder = !!builder;
    this.entityKey = this.isEndpoint ?
      EntityCatalogueHelpers.buildEntityKey(EntityCatalogueHelpers.endpointType, baseEntity.type) :
      EntityCatalogueHelpers.buildEntityKey(baseEntity.type, this.isStratosType ? '' : baseEntity.endpoint.type);
  }

  public _assignStore(store: Store<AppState>) {
    if (store) {
      this.store = store;
    }
  }

  private populateEntity(entity: IStratosEntityDefinition | IStratosEndpointDefinition) {
    const schema = entity.schema instanceof EntitySchema ? {
      default: entity.schema
    } : entity.schema;

    return {
      ...entity,
      type: entity.type || schema.default.entityType,
      label: entity.label || 'Unknown',
      labelPlural: entity.labelPlural || entity.label || 'Unknown',
      schema
    };
  }
  /**
   * Gets the schema associated with the entity type.
   * If no schemaKey is provided then the default schema will be returned
   */
  public getSchema(schemaKey?: string) {
    // TODO(NJ) We should do a better job at typeing schemax
    // schema always gets changed to a EntityCatalogueSchamas.
    const catalogueSchema = (this.entity.schema as EntityCatalogueSchemas);
    if (!schemaKey || this.isEndpoint) {
      return catalogueSchema.default;
    }
    const entityCatalogue = this.entity as IStratosEntityDefinition;
    const tempId = EntityCatalogueHelpers.buildEntityKey(entityCatalogue.endpoint.type, schemaKey);
    if (!catalogueSchema[schemaKey] && tempId === this.entityKey) {
      // We've requested the default by passing the schema key that matches the entity type
      return catalogueSchema.default;
    }
    return catalogueSchema[schemaKey];
  }

  public getEntityMonitor(
    entityId: string,
    {
      schemaKey = '',
      startWithNull = false
    }
  ) {
    return new EntityMonitor(this.store, entityId, this.entityKey, this.getSchema(schemaKey), startWithNull);
  }

  public getPaginationMonitor(
    paginationKey: string,
    {
      schemaKey = '',
      isLocal = false
    }
  ) {
    return new PaginationMonitor(this.store, paginationKey, this.getSchema(schemaKey), isLocal);
  }


  public getTypeAndSubtype() {
    const type = this.entity.parentType || this.entity.type;
    const subType = this.entity.parentType ? this.entity.type : null;
    return {
      type,
      subType
    };
  }
}

export class StratosCatalogueEntity<T extends IEntityMetadata = IEntityMetadata, Y = any> extends StratosBaseCatalogueEntity<T, Y> {
  public entity: IStratosEntityDefinition<EntityCatalogueSchemas>;
  constructor(
    entity: IStratosEntityDefinition,
    builder?: IStratosEntityBuilder<T, Y>
  ) {
    super(entity, builder);
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
  public entity: IStratosEndpointDefinition;
  constructor(
    entity: IStratosEndpointWithoutSchemaDefinition | IStratosEndpointDefinition,
    getLink?: (metadata: IEndpointFavMetadata) => string
  ) {
    const fullEntity = {
      ...entity,
      schema: {
        default: endpointEntitySchema
      }
    } as IStratosEndpointDefinition;
    super(fullEntity, {
      ...StratosCatalogueEndpointEntity.baseEndpointRender,
      getLink: getLink || StratosCatalogueEndpointEntity.baseEndpointRender.getLink
    });
  }
}