import { createSelector } from '@ngrx/store';
import { APIResource } from '../../../store/src/types/api.types';
import { getCFEntityKey } from '../cf-entity-helpers';
import { cfEntityId, CFEntityRef } from '../cf-entity-ref';

type RequestDataState = Record<string, Record<string, APIResource<unknown>>>;
type StateWithRequest = { request?: RequestDataState };

export function selectCFEntity<T = unknown>(entityType: string, ref: CFEntityRef) {
  const entityKey = getCFEntityKey(entityType);
  const id = cfEntityId(ref);
  return createSelector(
    (state: StateWithRequest) => state?.request?.[entityKey] ?? {},
    (dict): APIResource<T> | null => (dict[id] as APIResource<T> | undefined) ?? null,
  );
}

export function selectCFEntities<T = unknown>(entityType: string, refs: CFEntityRef[]) {
  const entityKey = getCFEntityKey(entityType);
  const ids = refs.map(cfEntityId);
  return createSelector(
    (state: StateWithRequest) => state?.request?.[entityKey] ?? {},
    (dict): APIResource<T>[] =>
      ids
        .map(id => dict[id] as APIResource<T> | undefined)
        .filter((e): e is APIResource<T> => e != null),
  );
}
