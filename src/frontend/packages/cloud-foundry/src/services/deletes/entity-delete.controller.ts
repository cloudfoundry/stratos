import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import type { AsyncJobResult } from '../async-jobs/async-job.types';
import { writeWithJob } from '../async-jobs/write-with-job';
import type { DeleteEvent, DeleteHandle, DeleteRequest } from './delete-event.types';

// ---------------------------------------------------------------------------
// Injection token — lets tests supply a fake without touching HttpClient.
// The default factory delegates to the real writeWithJob import so the
// production code path is unchanged.
// ---------------------------------------------------------------------------

export type WriteWithJobFn = (
  http: HttpClient,
  call$: Observable<HttpResponse<unknown>>,
) => Promise<AsyncJobResult<unknown>>;

export const WRITE_WITH_JOB = new InjectionToken<WriteWithJobFn>(
  'WRITE_WITH_JOB',
  {
    providedIn: 'root',
    factory: () => writeWithJob,
  },
);

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class EntityDeleteController {
  private readonly http = inject(HttpClient);
  private readonly writeFn = inject(WRITE_WITH_JOB);

  delete(req: DeleteRequest): DeleteHandle {
    const subject = new ReplaySubject<DeleteEvent>();

    // Base fields shared by every event in this lifecycle.
    const base: Omit<DeleteEvent, 'state'> = {
      cnsiGuid: req.cnsiGuid,
      cnsiName: req.cnsiName,
      entityKind: req.entityKind,
      deleteGuid: req.deleteGuid,
      deleteName: req.deleteName,
    };

    const done = new Promise<DeleteEvent>((resolve) => {
      // Kick off the async operation; subscription happens inside.
      (async () => {
        const startEvent: DeleteEvent = { ...base, state: 'start' };
        subject.next(startEvent);

        let terminal: DeleteEvent;
        try {
          await this.writeFn(this.http, req.call());
          terminal = { ...base, state: 'success' };
        } catch (error: unknown) {
          terminal = { ...base, state: 'failure', error };
        }

        subject.next(terminal);
        subject.complete();
        resolve(terminal);
      })();
    });

    return { events$: subject.asObservable(), done };
  }
}
