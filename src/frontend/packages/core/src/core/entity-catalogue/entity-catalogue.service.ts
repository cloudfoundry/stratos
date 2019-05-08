import { Injectable } from '@angular/core';
import { StratosBaseCatalogueEntity, StratosCatalogueEntity, StratosCatalogueEndpointEntity } from './entity-catalogue.types';

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

  public getEntity(entityType: string, endpointType: string) {
    const id = StratosBaseCatalogueEntity.buildId(entityType, endpointType);
    if (entityType === StratosBaseCatalogueEntity.endpointType) {
      return this.endpoints.get(id);
    }
    return this.entities.get(id);
  }
  public getAllEntitiesForEndpointType(endpointType: string) {
    return Array.from(this.entities.values()).filter(entities => entities.entity.endpoint.type === endpointType)
  }
}
