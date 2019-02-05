import {
  IRecentlyVisitedState,
  IRecentlyVisitedEntities,
  IEntityHit,
  IRecentlyVisitedEntity,
  IRecentlyVisitedEntityDated
} from '../../types/recently-visited.types';
import { AddRecentlyVisitedEntityAction, SetRecentlyVisitedEntityAction } from '../../actions/recently-visited.actions';
import {
  DISCONNECT_ENDPOINTS_SUCCESS,
  UNREGISTER_ENDPOINTS_SUCCESS,
  DisconnectEndpoint,
  GetAllEndpointsSuccess,
  GET_ENDPOINTS_SUCCESS
} from '../../actions/endpoint.actions';
import { Action } from '@ngrx/store';

const MAX_RECENT_COUNT = 100;

const getDefaultState = () => ({
  entities: {},
  hits: []
});

export function recentlyVisitedReducer(
  state: IRecentlyVisitedState = getDefaultState(),
  action: Action
): IRecentlyVisitedState {
  switch (action.type) {
    case AddRecentlyVisitedEntityAction.ACTION_TYPE:
      return addNewHit(state, action as AddRecentlyVisitedEntityAction);
    case SetRecentlyVisitedEntityAction.ACTION_TYPE:
      const setAction = action as SetRecentlyVisitedEntityAction;
      return {
        hits: state.hits,
        entities: {
          ...state.entities,
          [setAction.recentlyVisited.guid]: setAction.recentlyVisited
        }
      };
    case DISCONNECT_ENDPOINTS_SUCCESS:
    case UNREGISTER_ENDPOINTS_SUCCESS:
      const removeEndpointAction = action as DisconnectEndpoint;
      return cleanRecentsList(state, [removeEndpointAction.guid]);
    case GET_ENDPOINTS_SUCCESS:
      const getAllAction = action as GetAllEndpointsSuccess;
      const connectedIds = Object.values(getAllAction.payload.entities.endpoint).reduce((ids, endpoint) => {
        if (endpoint.user) {
          ids.push(endpoint.guid);
        }
        return ids;
      }, []);
      return cleanRecentsList(state, connectedIds, true);
  }
  return state;
}

function addNewHit(state: IRecentlyVisitedState, action: AddRecentlyVisitedEntityAction): IRecentlyVisitedState {
  const entities = state.entities;
  const newHit = {
    guid: action.recentlyVisited.guid,
    date: action.recentlyVisited.date
  } as IEntityHit;
  const hits = [
    newHit,
    ...trimRecent(state.hits),
  ];
  const newEntities = getEntities(entities, newHit, action.recentlyVisited);
  const newState = {
    entities: newEntities,
    hits
  };
  return shouldTrim(state.hits) ? cleanEntities(newState) : newState;
}

function getEntities(entities: IRecentlyVisitedEntities, newHit: IEntityHit, recentlyVisited: IRecentlyVisitedEntityDated) {
  if (!entities[newHit.guid]) {
    return {
      ...entities,
      [newHit.guid]: recentlyVisited
    };
  }
  return entities;
}

function trimRecent(hits: IEntityHit[]) {
  if (shouldTrim(hits)) {
    return hits.slice(0, MAX_RECENT_COUNT - 1);
  }
  return hits;
}

function shouldTrim(hits: IEntityHit[]) {
  return hits.length >= MAX_RECENT_COUNT;
}

function cleanRecentsList(state: IRecentlyVisitedState, endpointGuids?: string[], inclusive = false): IRecentlyVisitedState {
  const isInList = endpointIdIsInList();
  if (!endpointGuids) {
    return state;
  }
  if (!endpointGuids.length) {
    return inclusive ? getDefaultState() : state;
  }
  const entities = Object.keys(state.entities).reduce((reducedRecents, currentRecentGuid) => {
    const currentRecent = state.entities[currentRecentGuid];
    const inList = isInList(currentRecent, endpointGuids);
    if (
      (!inList && !inclusive) ||
      (inList && inclusive)
    ) {
      reducedRecents[currentRecentGuid] = currentRecent;
    }
    return reducedRecents;
  }, {});
  const hits = state.hits.reduce((reducedHits, hit) => {
    if (idExistsInEntityList(hit.guid, entities)) {
      reducedHits.push(hit);
    }
    return reducedHits;
  }, []);
  return {
    entities,
    hits
  };
}

function cleanEntities(state: IRecentlyVisitedState) {
  const entities = Object.keys(state.entities).reduce((reducedRecents, currentRecentGuid) => {
    const currentRecent = state.entities[currentRecentGuid];
    const hasHit = state.hits.find(hit => hit.guid === currentRecentGuid);
    if (hasHit) {
      reducedRecents[currentRecentGuid] = currentRecent;
    }
    return reducedRecents;
  }, {});
  return {
    entities,
    hits: state.hits
  };
}

const endpointIdIsInList = () => {
  const recentCache = {};
  return (recent: IRecentlyVisitedEntity, endpointGuids: string[]) => {
    const { endpointId } = recent;
    const cached = recentCache[endpointId];
    if (cached === true || cached === false) {
      return cached;
    }
    recentCache[endpointId] = endpointGuids.includes(recent.endpointId);
    return recentCache[endpointId];
  };
};

const idExistsInEntityList = (id: string, recents: IRecentlyVisitedEntities) => {
  return !!recents[id];
};
