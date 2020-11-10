import { OperatorFunction } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

// Helper operators

// Monitors an entity fetch operation and generates a single boolean to
// indicate if the fetch succeeded without an error
export function entityFetchedWithoutError<T>(): OperatorFunction<T, boolean> {
  return input$ => input$.pipe(
    pairwise(),
    filter(([oldV, newV]) => (oldV as any).fetching && !(newV as any).fetching),
    map(([, newV]) => newV),
    map(f => !(f as any).error)
  )
};
