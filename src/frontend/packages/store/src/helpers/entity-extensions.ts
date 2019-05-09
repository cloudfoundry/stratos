import { addEntityToCache } from './entity-factory';
import { defaultCfEntitiesState } from '../types/entity.types';
import { registerAPIRequestEntity } from '../reducers/api-request-reducers.generator';
import { setDefaultPaginationState } from '../reducers/pagination-reducer/pagination.reducer';
import { EntityCatalogueService } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';

// Allow extenstions to add entities to the entity cache
export function addExtensionEntities(entityCatalogue: EntityCatalogueService) {
  entityCatalogue.getAllEntitiesTypes().forEach(definition => {
    const { entity } = definition;
    console.log(definition);
    addEntityToCache(entity.schema);
    defaultCfEntitiesState[definition.id] = {};
    console.log(defaultCfEntitiesState);
    registerAPIRequestEntity(definition.id);
  });

  setDefaultPaginationState({ ...defaultCfEntitiesState });
}
