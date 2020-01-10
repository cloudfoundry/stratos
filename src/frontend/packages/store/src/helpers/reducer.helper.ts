import { stratosEndpointGuidKey } from '../entity-request-pipeline/pipeline.types';

export const mergeState = (state, newState) => {
  const baseState = { ...state };

  Object.keys(newState).forEach(entityKey => {
    if (shouldMerge(newState, baseState, entityKey)) {
      baseState[entityKey] = {
        ...baseState[entityKey],
        ...newState[entityKey]
      };
    } else {
      baseState[entityKey] = newState[entityKey];
    }
  });
  return baseState;
};

export const deepMergeState = (state, newState) => {
  const baseState = { ...state };
  Object.keys(newState).forEach(entityKey => {
    if (shouldMerge(newState, baseState, entityKey)) {
      const baseStateEnt = { ...baseState[entityKey] };
      const newStateEnt = newState[entityKey];
      Object.keys(newStateEnt).forEach(id => {
        baseStateEnt[id] = mergeEntity(
          baseStateEnt[id],
          newStateEnt[id]
        );
      });
      baseState[entityKey] = mergeEntity(
        baseState[entityKey],
        baseStateEnt
      );
    } else {
      baseState[entityKey] = newState[entityKey];
    }
  });
  return baseState;
};

export function mergeEntity(baseEntity, newEntity) {
  if (baseEntity && baseEntity.entity) {
    const merged = {
      entity: merge(baseEntity.entity, newEntity.entity),
      // Always apply the metadata regardless of whether it exists in the baseEntity or not
      // (for cases where we fetch missing inline data of an entity before the entity exists, for example fetch orgs and their spaces..
      // .. one org has over 50 spaces.. we fetch that list of spaces and apply it to a new org entity without metadata BEFORE we apply the
      // main org and mark it as fetched)
      metadata: baseEntity.metadata ? merge(baseEntity.metadata, newEntity.metadata) : newEntity.metadata
    };
    if (baseEntity[stratosEndpointGuidKey]) {
      merged[stratosEndpointGuidKey] = baseEntity[stratosEndpointGuidKey];
    }
    return merged;
  } else {
    return merge(baseEntity, newEntity);
  }
}

function merge(baseObject, newObject) {
  return {
    ...baseObject,
    ...newObject
  };
}

function shouldMerge(newState, baseState, entityKey) {
  return typeof newState[entityKey] !== 'string' && baseState[entityKey] && Object.keys(baseState[entityKey]);
}

export const pick = <O, K extends keyof O>(o: O, keys: string[]): Pick<O, K> => {
  const copy: any = {};
  if (!o) {
    return null;
  }
  keys.forEach(k => {
    copy[k] = o[k];
  });
  return copy;
};

export const composeFn = (...fns) =>
  fns.reverse().reduce((prevFn, nextFn) =>
    value => nextFn(prevFn(value)),
    value => value
  );
