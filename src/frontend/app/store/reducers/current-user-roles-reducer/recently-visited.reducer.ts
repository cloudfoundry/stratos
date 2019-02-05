import { IRecentlyVisitedState, IRecentlyVisitedEntities, IEntityHit, IRecentlyVisitedEntity } from '../../types/recently-visited.types';
import { AddRecentlyVisitedEntityAction } from '../../actions/recently-visited.actions';
import {
  DISCONNECT_ENDPOINTS_SUCCESS,
  UNREGISTER_ENDPOINTS_SUCCESS,
  DisconnectEndpoint,
  GetAllEndpointsSuccess,
  GET_ENDPOINTS_SUCCESS
} from '../../actions/endpoint.actions';
import { Action } from '@ngrx/store';

const MAX_RECENT_COUNT = 200;

export function recentlyVisitedReducer(
  state: IRecentlyVisitedState = {
    entities: {},
    hits: []
  },
  action: Action
): IRecentlyVisitedState {
  switch (action.type) {
    case AddRecentlyVisitedEntityAction.ACTION_TYPE:
      return addNewHit(state, action as AddRecentlyVisitedEntityAction);
    case DISCONNECT_ENDPOINTS_SUCCESS:
    case UNREGISTER_ENDPOINTS_SUCCESS:
      const removeEndpointAction = action as DisconnectEndpoint;
      return cleanRecentsList(state, [removeEndpointAction.guid]);
    case GET_ENDPOINTS_SUCCESS:
      const getAllAction = action as GetAllEndpointsSuccess;
      return cleanRecentsList(state, getAllAction.payload.result, true);
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
  if (!entities[newHit.guid]) {
    return {
      entities: {
        ...entities,
        [newHit.guid]: action.recentlyVisited
      },
      hits
    };
  }
  return {
    entities,
    hits
  };
}

function trimRecent(hits: IEntityHit[]) {
  if (hits.length > MAX_RECENT_COUNT) {
    return hits.slice(0, MAX_RECENT_COUNT - 1);
  }
  return hits;
}

function cleanRecentsList(state: IRecentlyVisitedState, endpointGuids?: string[], completeList = false): IRecentlyVisitedState {
  const isInList = endpointIdIsInList();
  if (!endpointGuids) {
    endpointGuids = state.hits.map(hit => hit.guid);
    completeList = true;
  }
  const entities = Object.keys(state.entities).reduce((reducedRecents, currentRecentGuid) => {
    const currentRecent = state.entities[currentRecentGuid];
    if (isInList(currentRecent, endpointGuids)) {
      if (completeList) {
        reducedRecents[currentRecentGuid] = currentRecent;
      }
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
