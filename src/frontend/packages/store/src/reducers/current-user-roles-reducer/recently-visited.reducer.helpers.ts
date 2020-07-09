import { AddRecentlyVisitedEntityAction } from '../../actions/recently-visited.actions';
import { IRecentlyVisitedEntity, IRecentlyVisitedState } from '../../types/recently-visited.types';

// Maximum number of recent entities to show to the user
export const MAX_RECENT_COUNT = 100;

// When the recent count goes above this, reduce it back down to the max
// This avoids us having to constantly trim the list once the max is hit
// We only ever show the max count number in the lists in the UI
const FLUSH_RECENT_COUNT = 150;

function recentArrayToMap(map: IRecentlyVisitedState, obj: IRecentlyVisitedEntity): IRecentlyVisitedState {
  map[obj.guid] = obj;
  return map;
}

// Default recent state is an empty object map
export const getDefaultRecentState = () => ({});

// An entity has been 'hit', so update the access date or add it to the recent history
export function addRecentlyVisitedEntity(state: IRecentlyVisitedState, action: AddRecentlyVisitedEntityAction): IRecentlyVisitedState {
  const newState = {
    ...state,
    [action.recentlyVisited.guid]: action.recentlyVisited
  };

  // Trim old data to keep the list in a manageable size
  return trimRecentsList(newState);
}

// Ensure the recents list stays at a manageable size
function trimRecentsList(state: IRecentlyVisitedState): IRecentlyVisitedState {
  if (Object.keys(state).length > FLUSH_RECENT_COUNT) {
    // The list size has gone over the flush count
    const entities = Object.values(state);
    // Cap the list at the maximum we can display
    const sorted = entities.sort((a, b) => b.date - a.date).slice(0, MAX_RECENT_COUNT);

    // Turn array back into a map
    return sorted.reduce(recentArrayToMap, {});
  }
  return state;
}

// Update the recents list - either removing any that reference and endpoint in the list OR keeping only those
// that reference an endpoint in the list
export function cleanRecentsList(state: IRecentlyVisitedState, endpointGuids: string[], inclusive = false): IRecentlyVisitedState {

  // Turn the guids into a map, for easier lookup of testing if an endpoint shold be kept or not
  const endpointMap = endpointGuids.reduce((m, obj) => {
    m[obj] = true;
    return m;
  }, {});

  // Filter all of the recent entities
  const filtered = Object.values(state).filter(entity => {
    // Was this endpoint in the list?
    const exists = endpointMap[entity.endpointId];
    return exists ? inclusive : !inclusive;
  });

  // Convert the array back into a map
  return filtered.reduce(recentArrayToMap, {});
}
