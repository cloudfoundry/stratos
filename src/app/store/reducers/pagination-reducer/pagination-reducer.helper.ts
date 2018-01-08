import { RequestTypes } from './../../actions/request.actions';
import { Action, Store } from '@ngrx/store';
import { denormalize, Schema } from 'normalizr';
import { Observable } from 'rxjs/Rx';

import { AddParams, SetParams } from '../../actions/pagination.actions';
import { AppState } from '../../app-state';
import { getAPIRequestDataState } from '../../selectors/api.selectors';
import { selectPaginationState } from '../../selectors/pagination.selectors';
import { PaginatedAction, PaginationEntityState, PaginationParam, QParam } from '../../types/pagination.types';
import { combineLatest } from 'rxjs/operator/combineLatest';
import { CombineLatestOperator } from 'rxjs/operators/combineLatest';

export interface PaginationObservables<T> {
  pagination$: Observable<PaginationEntityState>;
  entities$: Observable<T[]>;
}

export function qParamsToString(params: QParam[]) {
  return params.map(joinQParam);
}

function joinQParam(q: QParam) {
  return `${q.key}${q.joiner}${(q.value as string[]).join ? (q.value as string[]).join(',') : q.value}`;
}

export function getUniqueQParams(action: AddParams | SetParams, state) {
  let qStatePrams: QParam[] = [].concat(state.params.q || []);
  const qActionPrams: QParam[] = [].concat(action.params.q || []);

  // Update existing q params
  for (const actionParam of qActionPrams) {
    const existingParam = qStatePrams.findIndex((stateParam: QParam) => stateParam.key === actionParam.key);
    if (existingParam >= 0) {
      qStatePrams[existingParam] = { ...actionParam };
    } else {
      qStatePrams.push(actionParam);
    }
  }

  //  Ensure q params are unique
  if (action.params.q) {
    qStatePrams = qStatePrams.concat(qActionPrams)
      .filter((q, index, self) => self.findIndex(
        (qs) => {
          return qs.key === q.key;
        }
      ) === index)
      .filter((q: QParam) => {
        // Filter out empties
        return !!q.value;
      });
  }
  return qStatePrams;
}

export function removeEmptyParams(params: PaginationParam) {
  const newObject = {};
  Object.keys(params).forEach(key => {
    if (params[key]) {
      newObject[key] = params[key];
    }
  });
  return newObject;
}

export function getActionType(action) {
  return action.type;
}

export function getAction(action): PaginatedAction {
  if (!action) {
    return null;
  }
  return action.apiAction ? action.apiAction : action;
}

export function getActionKey(action) {
  const apiAction = getAction(action);
  return apiAction.entityKey || null;
}

export function getPaginationKey(action: PaginatedAction) {
  const apiAction = getAction(action);
  return apiAction.paginationKey;
}

export const getPaginationObservables = <T = any>(
  { store, action, schema }: { store: Store<AppState>, action: PaginatedAction, schema: Schema },
  uid?: string, // TODO: Delete me?
  isLocal = false
): PaginationObservables<T> => {
  const { entityKey, paginationKey } = action;

  if (action.initialParams) {
    store.dispatch(new SetParams(entityKey, paginationKey, action.initialParams, isLocal));
  }

  const obs = getObservables<T>(
    store,
    entityKey,
    paginationKey,
    action,
    schema,
    isLocal
  );

  return obs;
};

function getObservables<T = any>(
  store: Store<AppState>,
  entityKey: string,
  paginationKey: string,
  action: Action,
  schema: Schema,
  isLocal = false)
  : PaginationObservables<T> {
  let hasDispatchedOnce = false;
  const paginationSelect$ = store.select(selectPaginationState(entityKey, paginationKey));

  const pagination$: Observable<PaginationEntityState> = paginationSelect$
    .filter(pagination => !!pagination);

  const entities$: Observable<T[]> =
    paginationSelect$
      .do(pagination => {
        if (!pagination || !(isLocal && hasDispatchedOnce) && !hasError(pagination) && !hasValidOrGettingPage(pagination)) {
          hasDispatchedOnce = true; // Ensure we set this first, otherwise we're called again instantly
          store.dispatch(action);
        }
      })
      .filter(pagination => {
        return !!pagination && (isLocal && pagination.currentPage !== 1) || isPageReady(pagination);
      })
      .withLatestFrom(store.select(getAPIRequestDataState))
      .map(([paginationEntity, entities]) => {
        let page;
        if (isLocal) {
          const pages = Object.values(paginationEntity.ids);
          page = [].concat.apply([], pages);
        } else {
          page = paginationEntity.ids[paginationEntity.currentPage];
        }
        return page ? denormalize(page, schema, entities) : null;
      });

  return {
    pagination$,
    entities$
  };
}

export function isPageReady(pagination: PaginationEntityState) {
  return !!pagination && !!pagination.ids[pagination.currentPage];
}

export function hasValidOrGettingPage(pagination: PaginationEntityState) {
  if (pagination && Object.keys(pagination).length) {
    const hasPage = !!pagination.ids[pagination.currentPage];

    return pagination.fetching || hasPage;
  } else {
    return false;
  }
}

export function hasError(pagination: PaginationEntityState) {
  return pagination && pagination.error;
}

