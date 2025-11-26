import type { OperatorFunction } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

import type { DeleteActionState, RequestInfoState } from './reducers/api-request-reducer/types';

// Helper operators

interface FetchableState {
  fetching: boolean;
  error?: boolean | string;
}

// Monitors an entity fetch operation and generates a single boolean to
// indicate if the fetch succeeded without an error
export function entityFetchedWithoutError<T extends FetchableState>(): OperatorFunction<T, boolean> {
  return input$ => input$.pipe(
    pairwise(),
    filter(([oldV, newV]) => oldV.fetching && !newV.fetching),
    map(([, newV]) => newV),
    map(f => !f.error)
  );
}

// Monitors an entity delete operation and generates a single boolean to
// indicate if the delete succeeded without an error
export function entityDeletedWithoutError<T extends RequestInfoState>(): OperatorFunction<T, boolean> {
  return input$ => input$.pipe(
    map((status: RequestInfoState) => status.deleting),
    pairwise(),
    filter(([oldV, newV]) => oldV.busy && !newV.busy),
    map(([, newV]) => newV),
    map(f => !f.error)
  );
}

// Monitors an entity delete operation
export function entityDeleted<T extends RequestInfoState>(): OperatorFunction<T, DeleteActionState> {
  return input$ => input$.pipe(
    map((status: RequestInfoState) => status.deleting),
    pairwise(),
    filter(([oldV, newV]) => oldV.busy && !newV.busy),
    map(([, newV]) => newV),
  );
}
