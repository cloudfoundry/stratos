import {
  StratosBaseCatalogueEntity,
  StratosCatalogueEndpointEntity,
  StratosCatalogueEntity,
  IEntityMetadata,
  IStratosEndpointDefinition,
} from './entity-catalogue.types';
import { EntityCatalogueHelpers } from './entity-catalogue.helper';
import { STRATOS_ENDPOINT_TYPE } from '../../base-entity-schemas';

class EntityCatalogue {
  private entities: Map<string, StratosCatalogueEntity> = new Map();
  private endpoints: Map<string, StratosCatalogueEndpointEntity> = new Map();

  public register(entity: StratosBaseCatalogueEntity) {
    if (entity.isEndpoint) {
      this.registerEndpoint(entity as StratosCatalogueEndpointEntity);
    } else {
      // We could auto register endpoints found in entities
      this.registerEntity(entity as StratosCatalogueEntity);
    }
  }

  private registerEndpoint(endpoint: StratosCatalogueEndpointEntity) {
    if (this.endpoints.has(endpoint.entityKey)) {
      console.warn(`Duplicate endpoint catalogue entity found. ID: ${endpoint.entityKey} - Type: ${endpoint.entity.type}`);
    } else {
      this.endpoints.set(endpoint.entityKey, endpoint);
    }
  }

  private registerEntity(entity: StratosCatalogueEntity) {
    if (this.entities.has(entity.entityKey)) {
      const { type } = entity.entity;
      console.warn(`Duplicate catalogue entity found. ID: ${entity.entityKey} - Type: ${type} - Endpoint: ${entity.entity.endpoint.type}`);
    } else {
      this.entities.set(entity.entityKey, entity);
    }
  }

  private getEntityOfType<T extends IEntityMetadata = IEntityMetadata, Y = any>(
    entityType: string,
    endpointType?: string
  ): StratosBaseCatalogueEntity {
    const id = endpointType ? EntityCatalogueHelpers.buildEntityKey(entityType, endpointType) : entityType;
    // STRATOS_ENDPOINT_TYPE is a special case for internal entities.
    if (endpointType !== STRATOS_ENDPOINT_TYPE && entityType === EntityCatalogueHelpers.endpointType) {
      return this.endpoints.get(id);
    }
    return this.entities.get(id) as StratosCatalogueEntity<T, Y>;
  }

  private getEndpointSubtype(endpoint: StratosCatalogueEndpointEntity, subtype: string) {
    const subTypes = endpoint.entity.subTypes;
    if (!subTypes) {
      return null;
    }
    return subTypes.find(subType => subType.type === subtype);
  }



  public getEntity<T extends IEntityMetadata = IEntityMetadata, Y = any>(
    endpointType: string,
    entityType: string,
    subType?: string
  ): StratosBaseCatalogueEntity {
    const entityOfType = this.getEntityOfType<T, Y>(entityType, endpointType);
    if (entityType === EntityCatalogueHelpers.endpointType && subType) {
      const subtype = this.getEndpointSubtype(entityOfType as StratosCatalogueEndpointEntity, subType);
      const endpoint = entityOfType.entity as IStratosEndpointDefinition;
      // Ensure the subtype inherits parent
      return new StratosCatalogueEndpointEntity({
        ...endpoint,
        ...subtype
      }, entityOfType.builder.getLink);
    }
    return entityOfType;
  }

  public getEndpoint(endpointType: string, subType?: string) {
    return this.getEntity(
      endpointType,
      EntityCatalogueHelpers.endpointType,
      subType
    ) as StratosCatalogueEndpointEntity;
  }

  public getAllEntitiesForEndpointType(endpointType: string) {
    return this.getAllEntitiesTypes().filter(entities => entities.entity.endpoint.type === endpointType);
  }

  public getAllEntitiesTypes() {
    return Array.from(this.entities.values());
  }

  public getAllBaseEndpointTypes() {
    return Array.from(this.endpoints.values());
  }

  public getAllEndpointTypes() {
    const baseEndpoints = Array.from(this.endpoints.values());
    return baseEndpoints.reduce((allEndpoints, baseEndpoint) => {
      allEndpoints.push(baseEndpoint);
      if (baseEndpoint.entity.subTypes) {
        baseEndpoint.entity.subTypes.forEach(subType => {
          allEndpoints.push(new StratosCatalogueEndpointEntity({
            ...baseEndpoint.entity,
            ...subType,
            parentType: baseEndpoint.entity.type
          },
            baseEndpoint.builder.getLink
          ));
        });
      }
      return allEndpoints;
    }, [] as StratosCatalogueEndpointEntity[]);
  }
}

export const entityCatalogue = new EntityCatalogue();
