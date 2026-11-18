import type { UnknownOutcome } from '../async-jobs/unknown-outcome-message';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

// `unknown`: the delete ended but its result could not be determined (the
// write resolved UNKNOWN). Nothing may act as if the entity were gone.
export type DeleteState = 'start' | 'in-process' | 'success' | 'failure' | 'blocked' | 'unknown';

/**
 * How a delete that did not fail ended, as runCfDelete reports it:
 * `unknown` when it ended with no known result, `still-running` when
 * Stratos stopped following it while CF was still running it.
 */
export type DeleteOutcome = 'deleted' | UnknownOutcome;

export type BlockReason = 'has-dependents' | 'operation-in-progress' | 'forbidden';

export interface DeleteEvent {
  state: DeleteState;
  cnsiName: string;
  cnsiGuid: string;
  deleteName: string;
  deleteGuid: string;
  entityKind: string;
  /** Populated when state === 'blocked'. */
  reason?: BlockReason;
  /** state === 'unknown' only: CF was still running the delete when Stratos stopped following it. */
  stillRunning?: boolean;
  error?: unknown;
}

export interface DeleteRequest {
  cnsiGuid: string;
  cnsiName: string;
  entityKind: string;
  deleteGuid: string;
  deleteName: string;
  call: () => Observable<HttpResponse<unknown>>;
}

export interface DeleteHandle {
  events$: Observable<DeleteEvent>;
  done: Promise<DeleteEvent>;
}

/**
 * Hook invoked after a successful delete so subscribers (favorites, recents)
 * can clean up references to the removed entity. Runs regardless of whether an
 * EndpointDataService cache exists for the endpoint — favorites/recents live
 * outside the per-cnsi cache.
 */
export type DeleteCleanupHook = (req: DeleteRequest) => void;
