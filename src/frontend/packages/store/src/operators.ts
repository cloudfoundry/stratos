import { OperatorFunction } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

import { DeleteActionState, RequestInfoState } from './reducers/api-request-reducer/types';

// Helper operators

// Monitors an entity fetch operation and generates a single boolean to
// indicate if the fetch succeeded without an error
export function entityFetchedWithoutError<T>(): OperatorFunction<T, boolean> {
  return input$ => input$.pipe(
    pairwise(),
    filter(([oldV, newV]) => (oldV as any).fetching && !(newV as any).fetching),
    map(([, newV]) => newV),
    map(f => !(f as any).error)
  );
}

// Monitors an entity delete operation and generates a single boolean to
// indicate if the delete succeeded without an error
export function entityDeletedWithoutError<T extends RequestInfoState>(): OperatorFunction<T, boolean> {
  return input$ => input$.pipe(
    map((status: RequestInfoState) => status.deleting),
    pairwise(),
    filter(([oldV, newV]) => (oldV as any).busy && !(newV as any).busy),
    map(([, newV]) => newV),
    map(f => !(f as any).error)
  );
}

// Monitors an entity delete operation
export function entityDeleted<T extends RequestInfoState>(): OperatorFunction<T, DeleteActionState> {
  return input$ => input$.pipe(
    map((status: RequestInfoState) => status.deleting),
    pairwise(),
    filter(([oldV, newV]) => (oldV as any).busy && !(newV as any).busy),
    map(([, newV]) => newV),
  );
}
