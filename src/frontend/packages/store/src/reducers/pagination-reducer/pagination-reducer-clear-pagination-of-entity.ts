import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { ClearPaginationOfEntity } from '../../actions/pagination.actions';
import { PaginationEntityState, PaginationState } from '../../types/pagination.types';
import { spreadClientPagination } from './pagination-reducer.helper';

export function paginationClearOfEntity(state: PaginationState, action: ClearPaginationOfEntity) {
  // Remove entities from a pagination list. Used for quickly showing the result of a delete
  const entityKey = entityCatalog.getEntityKey(action.entityConfig);
  if (state[entityKey]) {
    const guid = action.entityGuid;

    const newState = { ...state };
    const entityState = newState[entityKey];

    const newEntityState = { ...entityState };

    // Remove from a single pagination section
    if (action.paginationKey && newEntityState[action.paginationKey]) {
      newEntityState[action.paginationKey] = clearPaginationOfEntity(newEntityState[action.paginationKey], guid);
    } else {
      // Remove from all pagination sections
      Object.keys(newEntityState).forEach(key => {
        // const entityPaginationState = newEntityState[key];
        newEntityState[key] = clearPaginationOfEntity(newEntityState[key], guid);
      });
    }
    newState[entityKey] = newEntityState;
    return newState;
  }
  return state;
}

function clearPaginationOfEntity(entityPaginationState: PaginationEntityState, guid: string) {
  // For each page in a pagination section
  const pageWithEntity = Object.keys(entityPaginationState.ids).find(pageKey => {
    // Does the entity exist in this page?
    const page = entityPaginationState.ids[pageKey];
    return page.indexOf(guid) >= 0;
  });

  if (pageWithEntity) {
    const page = entityPaginationState.ids[pageWithEntity];
    const index = page.indexOf(guid);
    // Recreate the pagination section with new values
    const newEntityPagState = {
      ...entityPaginationState,
      ids: { ...entityPaginationState.ids },
      clientPagination: spreadClientPagination(entityPaginationState.clientPagination)
    };
    newEntityPagState.ids[pageWithEntity] = [...newEntityPagState.ids[pageWithEntity]];
    newEntityPagState.ids[pageWithEntity].splice(index, 1);
    newEntityPagState.totalResults--;
    const clientPag = newEntityPagState.clientPagination;
    clientPag.totalResults--;
    clientPag.currentPage = 1;
    return newEntityPagState;
  }
  return entityPaginationState;
}
