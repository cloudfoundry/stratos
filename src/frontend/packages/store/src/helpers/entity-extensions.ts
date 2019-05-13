import { addEntityToCache } from './entity-factory';
import { defaultCfEntitiesState } from '../types/entity.types';
import { registerAPIRequestEntity } from '../reducers/api-request-reducers.generator';
import { setDefaultPaginationState } from '../reducers/pagination-reducer/pagination.reducer';
import { EntityCatalogueService } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';

// Allow extenstions to add entities to the entity cache
export function addExtensionEntities(entityCatalogue: EntityCatalogueService) {
  entityCatalogue.getAllEntitiesTypes().forEach(definition => {
    const { entity } = definition;
    // TODO: This will not be needed once the entity catalogue work is finished
    Object.keys(entity.schema).forEach(
      schemaKey => schemaKey === 'default' ?
        addEntityToCache(entity.schema[schemaKey]) :
        addEntityToCache(entity.schema[schemaKey], schemaKey)
    );

    defaultCfEntitiesState[definition.id] = {};
    registerAPIRequestEntity(definition.id);
  });

  setDefaultPaginationState({ ...defaultCfEntitiesState });
}
