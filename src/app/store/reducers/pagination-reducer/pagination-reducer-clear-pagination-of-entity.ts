import { PaginationState } from '../../types/pagination.types';
export function paginationClearOfEntity(state: PaginationState, action) {
  // Remove entities from a pagination list. Used for quickly showing the result of a delete
  if (state[action.entityKey]) {
    const guid = action.entityGuid;

    const newState = { ...state };
    const entityState = newState[action.entityKey];

    const newEntityState = { ...entityState };

    // For each pagination section of an entity type
    Object.keys(newEntityState).forEach(key => {
      const entityPaginationState = newEntityState[key];
      // For each page in a pagination section
      Object.keys(entityPaginationState.ids).forEach(pageKey => {
        // Does the entity exist in this page?
        const page = entityPaginationState.ids[pageKey];
        const index = page.indexOf(guid);
        if (index >= 0) {
          // Recreate the pagination section with new values
          const newEntityPaginationState = {
            ...entityPaginationState,
            ids: { ...entityPaginationState.ids },
            clientPagination: {
              ...entityPaginationState.clientPagination
            }
          };
          newEntityPaginationState.ids[pageKey] = [...newEntityPaginationState.ids[pageKey]];
          newEntityPaginationState.ids[pageKey].splice(index, 1);
          newEntityPaginationState.totalResults--;
          newEntityPaginationState.clientPagination.totalResults--;
          newEntityState[key] = newEntityPaginationState;
        }
      });
    });
    newState[action.entityKey] = newEntityState;
    return newState;
  }
  return state;
}
