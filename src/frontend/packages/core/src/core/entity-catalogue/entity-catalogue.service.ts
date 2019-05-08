import { Injectable } from '@angular/core';
import { IEndpointFavMetadata } from '../../../../store/src/types/user-favorites.types';
import { IEntityMetadata, StratosBaseCatalogueEntity, StratosCatalogueEndpointEntity, StratosCatalogueEntity } from './entity-catalogue.types';

@Injectable({
  providedIn: 'root'
})
export class EntityCatalogueService {
  private entities: Map<string, StratosCatalogueEntity> = new Map();
  private endpoints: Map<string, StratosCatalogueEndpointEntity> = new Map();

  public register(entity: StratosCatalogueEntity | StratosCatalogueEndpointEntity) {
    if (entity.isEndpoint) {
      this.registerEndpoint(entity as StratosCatalogueEndpointEntity);
    } else {
      // We could auto register endpoints found in entities
      this.registerEntity(entity as StratosCatalogueEntity);
    }
  }

  private registerEndpoint(endpoint: StratosCatalogueEndpointEntity) {
    if (this.endpoints.has(endpoint.id)) {
      throw (
        new Error(`Duplicate entity found. ID: ${endpoint.id} - Type: ${endpoint.entity.type}`)
      );
    } else {
      this.endpoints.set(endpoint.id, endpoint);
    }
  }

  private registerEntity(entity: StratosCatalogueEntity) {
    if (this.entities.has(entity.id)) {
      throw (
        new Error(`Duplicate entity found. ID: ${entity.id} - Type: ${entity.entity.type} - Endpoint type: ${entity.entity.endpoint}`)
      );
    } else {
      this.entities.set(entity.id, entity);
    }
  }

  private getEntityOfType<T>(entityType: string, endpointType: string) {
    const id = StratosBaseCatalogueEntity.buildId(entityType, endpointType);
    if (entityType === StratosBaseCatalogueEntity.endpointType) {
      return this.endpoints.get(id);
    }
    return this.entities.get(id);
  }

  private getEndpointSubtype(endpoint: StratosCatalogueEndpointEntity, subtype: string) {
    const subTypes = endpoint.entity.subTypes;
    if (!subTypes) {
      return null;
    }
    return subTypes.find(subType => subType.type === subtype);
  }

  public getEntity<T extends IEntityMetadata>(entityType: string, endpointType: string, subType?: string) {
    const entityOfType = this.getEntityOfType(entityType, endpointType) as StratosCatalogueEndpointEntity<any, T>;
    if (entityType === StratosBaseCatalogueEntity.endpointType && subType) {
      const subtype = this.getEndpointSubtype(entityOfType as StratosCatalogueEndpointEntity, subType);
      // Ensure the subtype inherits parent
      return {
        ...entityOfType,
        ...subtype
      };
    }
    return entityOfType;
  }

  public getEndpoint(endpointType: string, subType?: string) {
    return this.getEntity<IEndpointFavMetadata>(
      StratosBaseCatalogueEntity.endpointType,
      endpointType,
      subType
    ) as StratosCatalogueEndpointEntity;
  }

  public getAllEntitiesForEndpointType(endpointType: string) {
    return Array.from(this.entities.values()).filter(entities => entities.entity.endpoint.type === endpointType)
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
            baseEndpoint.builder,
            // TODO: This need to be per subtype
            baseEndpoint.rendererPriority));
        });
      }
      return allEndpoints;
    }, [] as StratosCatalogueEndpointEntity[]);
  }
}
