import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

export type DeleteState = 'start' | 'in-process' | 'success' | 'failure' | 'blocked';

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
