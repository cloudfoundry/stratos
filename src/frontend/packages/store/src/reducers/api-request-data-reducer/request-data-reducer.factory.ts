import { Action, ActionReducer } from '@ngrx/store';

import {
  REMOVE_ENTITIES_FOR_ENDPOINT,
  RemoveEntitiesForEndpoint,
} from '../../actions/remove-entities-for-endpoint.actions';
import { RECURSIVE_ENTITY_SET_DELETED, SetTreeDeleted } from '../../effects/recursive-entity-delete.effect';
import { InitCatalogEntitiesAction } from '../../entity-catalog.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { getDefaultStateFromEntityCatalog } from '../../entity-catalog/entity-catalog.store-setup';
import { deepMergeState } from '../../helpers/reducer.helper';
import { IFlatTree } from '../../helpers/schema-tree-traverse';
import { ISuccessRequestAction } from '../../types/request.types';
import { IRequestArray } from '../api-request-reducer/types';


export function requestDataReducerFactory(actions: IRequestArray): ActionReducer<Record<string, any>> {
  const successAction = actions[1];
  return function entitiesReducer(state = {}, action: Action): Record<string, any> {
    switch (action.type) {
      case InitCatalogEntitiesAction.ACTION_TYPE:
        return getDefaultStateFromEntityCatalog((action as InitCatalogEntitiesAction).entityKeys, {}, state);
      case successAction: {
        const success = action as ISuccessRequestAction;
        if (!success.apiAction.updatingKey && success.requestType === 'delete') {
          const entityKey = entityCatalog.getEntity(success.apiAction).entityKey;
          return deleteEntity(state, entityKey, success.apiAction.guid);
        } else if (success.response) {
          return deepMergeState(state, success.response.entities);
        }
        return state;
      }
      case RECURSIVE_ENTITY_SET_DELETED:
        return cleanStateFromFlatTree(state, action as SetTreeDeleted);
      case REMOVE_ENTITIES_FOR_ENDPOINT:
        return removeEntitiesForEndpoint(state, action as RemoveEntitiesForEndpoint);
      default:
        return state;
    }
  };
}

/**
 * Wave 4 part 2 (W36-B) — replacement for the legacy per-entity
 * `endpointDisconnectRemoveEntitiesReducer()` dataReducers that used to be
 * registered 26 times in cf-entity-generator + 4 times in
 * git-entity-generator. The action carries the disconnecting endpoint's
 * type + guid; this walks every entity registered against that endpoint type
 * (via the entity catalog) and deletes any record in that entity's slice
 * whose `cfGuid`/`endpointGuid` matches.
 *
 * Both `cfGuid` and `endpointGuid` are checked because:
 *   - CF entities (and many APIResource-wrapped entities) tag records with
 *     `cfGuid` (top-level OR nested under `entity.`)
 *   - Git entities tag records with `endpointGuid` (top-level)
 * Anything that doesn't match either field is left alone, so unrelated
 * entity types (e.g. dashboard slices) are unaffected even if they end up
 * inside the same endpoint type's catalog group.
 */
function removeEntitiesForEndpoint(
  state: Record<string, any>,
  action: RemoveEntitiesForEndpoint,
): Record<string, any> {
  const defs = entityCatalog.getAllEntitiesForEndpointType(action.endpointType);
  if (!defs?.length) {
    return state;
  }
  let next = state;
  let mutated = false;
  for (const def of defs) {
    const entityKey = def.entityKey;
    if (!entityKey) {
      continue;
    }
    const slice = state[entityKey];
    if (!slice || typeof slice !== 'object') {
      continue;
    }
    const filtered = pruneEntitySlice(slice, action.endpointGuid);
    if (filtered !== slice) {
      if (!mutated) {
        next = { ...state };
        mutated = true;
      }
      next[entityKey] = filtered;
    }
  }
  return next;
}

function pruneEntitySlice(slice: Record<string, any>, endpointGuid: string): Record<string, any> {
  const ids = Object.keys(slice);
  if (ids.length === 0) {
    return slice;
  }
  let removed = false;
  const result: Record<string, any> = {};
  for (const id of ids) {
    const entry = slice[id];
    if (!entry) {
      result[id] = entry;
      continue;
    }
    const owningGuid = extractEndpointGuid(entry);
    if (owningGuid === endpointGuid) {
      removed = true;
      continue;
    }
    result[id] = entry;
  }
  return removed ? result : slice;
}

function extractEndpointGuid(entry: any): string | undefined {
  // CF APIResource pattern: { entity: { cfGuid }, metadata: { ... } }
  if (entry.entity && typeof entry.entity === 'object') {
    const fromEntity = entry.entity.cfGuid ?? entry.entity.endpointGuid;
    if (typeof fromEntity === 'string') {
      return fromEntity;
    }
  }
  // Flat shape (cf "raw" entity types, git entities)
  const flat = entry.cfGuid ?? entry.endpointGuid;
  return typeof flat === 'string' ? flat : undefined;
}

function cleanStateFromFlatTree(state: Record<string, any>, action: SetTreeDeleted): Record<string, any> {
  const { tree } = action;
  return Object.keys(tree).reduce(reduceTreeToState(tree), { ...state });
}

function reduceTreeToState(tree: IFlatTree) {
  return (state: Record<string, any>, entityKey: string) => {
    const ids = tree[entityKey].ids;
    return Array.from(ids).reduce(reduceIdsToState(entityKey), state);
  };
}

function reduceIdsToState(entityKey: string) {
  return (state: Record<string, any>, id: string) => {
    const {
      [id]: omit,
      ...newState
    } = state[entityKey];

    return {
      ...state,
      [entityKey]: newState
    };
  };
}

function deleteEntity(state: any, entityKey: any, guid: any) {
  const newState = {} as Record<string, any>;
  for (const entityTypeKey in state) {
    if (entityTypeKey === entityKey) {
      newState[entityTypeKey] = {};
      for (const entityGuid in state[entityTypeKey]) {
        if (entityGuid !== guid) {
          newState[entityTypeKey][entityGuid] = state[entityTypeKey][entityGuid];
        }
      }
    } else {
      newState[entityTypeKey] = state[entityTypeKey];
    }
  }
  return newState;
}
