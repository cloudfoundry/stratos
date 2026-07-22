import { APIResource } from '../../../store/src/types/api.types';
import { getCFEntityKey } from '../cf-entity-helpers';
import { cfEntityId, CFEntityRef } from '../cf-entity-ref';

// These were ngrx `createSelector` selectors; with the ngrx runtime removed
// they are plain state-projection functions. No memoization is relied upon
// (callers invoke them directly with a state object).
type RequestDataState = Record<string, Record<string, APIResource<unknown>>>;
type StateWithRequest = { request?: RequestDataState };

export function selectCFEntity<T = unknown>(entityType: string, ref: CFEntityRef) {
  const entityKey = getCFEntityKey(entityType);
  const id = cfEntityId(ref);
  return (state: StateWithRequest): APIResource<T> | null => {
    const dict = state?.request?.[entityKey] ?? {};
    return (dict[id] as APIResource<T> | undefined) ?? null;
  };
}

export function selectCFEntities<T = unknown>(entityType: string, refs: CFEntityRef[]) {
  const entityKey = getCFEntityKey(entityType);
  const ids = refs.map(cfEntityId);
  return (state: StateWithRequest): APIResource<T>[] => {
    const dict = state?.request?.[entityKey] ?? {};
    return ids
      .map(id => dict[id] as APIResource<T> | undefined)
      .filter((e): e is APIResource<T> => e != null);
  };
}
