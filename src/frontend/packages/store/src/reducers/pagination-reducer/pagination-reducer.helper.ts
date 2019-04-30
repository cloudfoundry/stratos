import { TryEntityPaginationFetchAction } from './../../effects/entity-fetcher.effect';
import { Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith } from 'rxjs/operators';
import { doOnFirstSubscribe } from '../../../../core/src/core/custom-operators';
import { PaginationMonitor } from '../../../../core/src/shared/monitors/pagination-monitor';
import { AddParams, SetInitialParams, SetParams } from '../../actions/pagination.actions';
import { AppState } from '../../app-state';
import { TryEntityPaginationValidationAction } from '../../effects/entity-fetcher.effect';
import { selectPaginationState } from '../../selectors/pagination.selectors';
import { PaginatedAction, PaginationClientPagination, PaginationEntityState, PaginationParam, QParam } from '../../types/pagination.types';


export interface PaginationObservables<T> {
  pagination$: Observable<PaginationEntityState>;
  entities$: Observable<T[]>;
  /**
   * Convenience observable on !!entities
   */
  hasEntities$: Observable<boolean>;
  /**
   * Convenience observable on pagination totalResults (note - not entities.length. In maxed world this can be different)
   */
  totalEntities$: Observable<number>;
  /**
   * Equate to current page fetching observable
   */
  fetchingEntities$: Observable<boolean>;
}

export function qParamsToString(params: QParam[]): string[] {
  return params.map(qParamToString);
}

export function qParamToString(q: QParam): string {
  return `${q.key}${q.joiner}${(q.value as string[]).join ? (q.value as string[]).join(',') : q.value}`;
}

export function qParamKeyFromString(qParamString: string): string {
  const match = qParamString.match(/(>=|<=|<|>| IN |,|:|=)/);
  return match.index >= 0 ? qParamString.substring(0, match.index) : null;
}

export function getUniqueQParams(action: AddParams | SetParams, state) {
  let qStatePrams: QParam[] = [].concat(state.params.q || []);
  const qActionPrams: QParam[] = [].concat(action.params.q || []);

  // Update existing q params
  for (const actionParam of qActionPrams) {
    const existingParamIndex = qStatePrams.findIndex((stateParam: QParam) => stateParam.key === actionParam.key);
    if (existingParamIndex >= 0) {
      qStatePrams[existingParamIndex] = { ...actionParam };
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

export function getActionPaginationEntityKey(action) {
  const apiAction = getAction(action);
  return apiAction.proxyPaginationEntityKey || apiAction.entityKey || null;
}

export function getPaginationKeyFromAction(action: PaginatedAction) {
  const apiAction = getAction(action);
  return apiAction.paginationKey;
}

export const getPaginationObservables = <T = any>(
  { store, action, paginationMonitor }: {
    store: Store<AppState>,
    action: PaginatedAction | PaginatedAction[],
    paginationMonitor: PaginationMonitor
  },
  isLocal = false
): PaginationObservables<T> => {
  const baseAction = Array.isArray(action) ? action[0] : action;
  const paginationKey = paginationMonitor.paginationKey;
  const entityKey = paginationMonitor.schema.key;

  // FIXME: This will reset pagination every time regardless of if we need to (or just want the pag settings/entities from pagination
  // section)
  if (baseAction.initialParams) {
    store.dispatch(new SetInitialParams(entityKey, paginationKey, baseAction.initialParams, isLocal));
  }

  const obs = getObservables<T>(
    store,
    entityKey,
    paginationKey,
    action,
    paginationMonitor,
    isLocal
  );

  return obs;
};


function getObservables<T = any>(
  store: Store<AppState>,
  entityKey: string,
  paginationKey: string,
  paginationAction: PaginatedAction | PaginatedAction[],
  paginationMonitor: PaginationMonitor,
  isLocal = false
)
  : PaginationObservables<T> {
  const arrayAction = Array.isArray(paginationAction) ? paginationAction : [paginationAction];
  const paginationSelect$ = store.select(selectPaginationState(entityKey, paginationKey));
  const pagination$: Observable<PaginationEntityState> = paginationSelect$.pipe(filter(pagination => !!pagination));

  const entities$: Observable<T[]> = paginationMonitor.currentPage$.pipe(
    doOnFirstSubscribe(() => {
      store.dispatch(new TryEntityPaginationValidationAction(
        paginationKey,
        entityKey,
        isLocal,
        arrayAction
      ));
      store.dispatch(new TryEntityPaginationFetchAction(
        paginationKey,
        entityKey,
        isLocal,
        arrayAction
      ));
    })
  );

  return {
    pagination$: pagination$.pipe(
      distinctUntilChanged()
    ),
    entities$: entities$.pipe(
      distinctUntilChanged()
    ),
    hasEntities$: entities$.pipe(
      map(entities => !!entities),
      // Entities will never fire in the event of a maxed list, so ensure we start with something
      startWith(false)
    ),
    totalEntities$: combineLatest(pagination$, entities$).pipe(
      map(([pag]) => pag.totalResults),
      distinctUntilChanged()
    ),
    fetchingEntities$: paginationMonitor.fetchingCurrentPage$
  };
}

export function spreadClientPagination(pag: PaginationClientPagination): PaginationClientPagination {
  return {
    ...pag,
    filter: {
      ...pag.filter,
      items: {
        ...pag.filter.items
      }
    }
  };
}

export function spreadPaginationParams(params: PaginationParam): PaginationParam {
  return {
    ...params,
    q: params.q ? params.q.reduce((newQ, qP) => {
      newQ.push({ ...qP });
      return newQ;
    }, []) : null
  };
}
