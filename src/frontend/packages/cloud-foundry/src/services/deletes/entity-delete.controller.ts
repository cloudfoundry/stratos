import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import type { AsyncJobResult } from '../async-jobs/async-job.types';
import { writeWithJob } from '../async-jobs/write-with-job';
import type { EntityKind } from '../data-sources/cascade-registry';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { EndpointDataRegistry } from '../endpoint-data/endpoint-data.registry';
import type { EndpointDataService } from '../endpoint-data/endpoint-data.service';
import { SignalRelationFetcherService } from '../../entity-relations/signal/signal-relation-fetcher.service';
import { affectedSlices, ENTITY_TYPE_TO_SLICE, referencingSlices } from './affected-slices';
import type { DeleteCleanupHook, DeleteEvent, DeleteHandle, DeleteRequest } from './delete-event.types';

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
// entityKind → EndpointDataService row-remover. Removing the deleted row keeps
// the originating slice consistent locally without a refetch; the *child*
// slices (from affectedSlices) are marked stale instead. Routes are a
// count-only slice with no row list, so they have no remover — they're handled
// purely via markStale('routes').
// ---------------------------------------------------------------------------

const ROW_REMOVERS: Readonly<Record<string, (eds: EndpointDataService, guid: string) => void>> = {
  organization: (eds, guid) => eds.removeOrg(guid),
  space: (eds, guid) => eds.removeSpace(guid),
  application: (eds, guid) => eds.removeApp(guid),
  serviceInstance: (eds, guid) => eds.removeServiceInstance(guid),
  serviceCredentialBinding: (eds, guid) => eds.removeServiceCredentialBinding(guid),
};

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class EntityDeleteController {
  private readonly http = inject(HttpClient);
  private readonly writeFn = inject(WRITE_WITH_JOB);
  private readonly endpoints = inject(EndpointDataRegistry);
  private readonly relations = inject(SignalRelationFetcherService);
  private readonly diagnostics = inject(StratosDiagnostics);

  // Cleanup subscribers (favorites, recents). Registered once at bootstrap;
  // invoked after every successful delete.
  private readonly cleanups: DeleteCleanupHook[] = [];

  /** Register a cleanup hook fired after each successful delete. */
  registerCleanup(hook: DeleteCleanupHook): void {
    this.cleanups.push(hook);
  }

  delete(req: DeleteRequest): DeleteHandle {
    const subject = new ReplaySubject<DeleteEvent>(3);

    // Base fields shared by every event in this lifecycle.
    const base: Omit<DeleteEvent, 'state'> = {
      cnsiGuid: req.cnsiGuid,
      cnsiName: req.cnsiName,
      entityKind: req.entityKind,
      deleteGuid: req.deleteGuid,
      deleteName: req.deleteName,
    };

    // Wrap subject.next so a synchronous observer throw cannot abort the
    // lifecycle — the terminal event and done resolution must always happen.
    const safeNext = (event: DeleteEvent): void => {
      try { subject.next(event); } catch { /* observer threw */ }
      try {
        this.diagnostics.emitCounter('delete-event', { state: event.state, entityKind: event.entityKind });
      } catch { /* diagnostics must never break the lifecycle */ }
    };

    const done = (async (): Promise<DeleteEvent> => {
      let terminal: DeleteEvent;
      try {
        safeNext({ ...base, state: 'start' });
        await this.writeFn(this.http, req.call());
        // Invalidate caches + run cleanup BEFORE emitting success so a
        // success observer sees a consistent post-delete world.
        this.invalidateAndCleanup(req);
        terminal = { ...base, state: 'success' };
      } catch (error: unknown) {
        terminal = { ...base, state: 'failure', error };
      }
      safeNext(terminal);
      try { subject.complete(); } catch { /* observer threw */ }
      return terminal;
    })();

    return { events$: subject.asObservable(), done };
  }

  // On success: derive the full invalidation set from the relation graph —
  // descendants (affectedSlices, containment) UNION referencing parents/siblings
  // (referencingSlices, reverse edges, so parent count columns + sibling
  // relationship lists refresh). Remove the deleted row, then fire cleanup
  // hooks. Each step is isolated so one failure can't strand the others or
  // reject the done promise. Cleanup hooks run even without a cached EDS —
  // favorites and recents live outside the per-cnsi cache.
  private invalidateAndCleanup(req: DeleteRequest): void {
    const eds = this.endpoints.peek(req.cnsiGuid);
    if (eds) {
      const remover = ROW_REMOVERS[req.entityKind];
      const slices = new Set<string>();
      try {
        const registry = this.relations.snapshotRegistry();
        affectedSlices(req.entityKind, registry).forEach(s => slices.add(s));
        referencingSlices(req.entityKind, registry).forEach(s => slices.add(s));
      } catch { /* invalidation is best-effort */ }
      // Count-only slices (e.g. routes) have no row list to patch, so there is
      // no remover — mark the entity's own slice stale to refetch its count.
      if (!remover) {
        const ownSlice = ENTITY_TYPE_TO_SLICE[req.entityKind];
        if (ownSlice) slices.add(ownSlice);
      }
      for (const slice of slices) {
        try { eds.markStale(slice as EntityKind); } catch { /* per-slice best-effort */ }
      }
      if (remover) {
        try { remover(eds, req.deleteGuid); } catch { /* row removal is best-effort */ }
      }
    }
    for (const cleanup of this.cleanups) {
      try { cleanup(req); } catch { /* one bad hook can't block the rest */ }
    }
  }
}
