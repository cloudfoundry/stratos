import { AddRecentlyVisitedEntityAction } from '../../actions/recently-visited.actions';
import {
  IEntityHit,
  IRecentlyVisitedEntities,
  IRecentlyVisitedEntity,
  IRecentlyVisitedEntityDated,
  IRecentlyVisitedState,
} from '../../types/recently-visited.types';

const MAX_RECENT_COUNT = 100;

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

export const getDefaultRecentState = () => ({
  entities: {},
  hits: []
});

export function addNewHit(state: IRecentlyVisitedState, action: AddRecentlyVisitedEntityAction): IRecentlyVisitedState {
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

export function cleanRecentsList(state: IRecentlyVisitedState, endpointGuids?: string[], inclusive = false): IRecentlyVisitedState {
  const isInList = endpointIdIsInList();
  if (!endpointGuids) {
    return state;
  }
  if (!endpointGuids.length) {
    return inclusive ? getDefaultRecentState() : state;
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

export function cleanEntities(state: IRecentlyVisitedState) {
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
