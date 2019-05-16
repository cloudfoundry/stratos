import { defaultCfEntitiesState } from '../types/entity.types';
import { registerAPIRequestEntity } from '../reducers/api-request-reducers.generator';
import { setDefaultPaginationState } from '../reducers/pagination-reducer/pagination.reducer';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';

// Allow extenstions to add entities to the entity cache
export function addExtensionEntities() {
  entityCatalogue.getAllEntitiesTypes().forEach(definition => {
    defaultCfEntitiesState[definition.entityKey] = {};
    registerAPIRequestEntity(definition.entityKey);
  });

  setDefaultPaginationState({ ...defaultCfEntitiesState });
}
