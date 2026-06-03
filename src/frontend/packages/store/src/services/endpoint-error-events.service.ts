import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, computed, signal } from '@angular/core';

import { InternalEventSeverity, InternalEventState, InternalEventStateMetadata } from '../types/internal-events.types';

// CAPI v3 error response shape used by `/v3/...` endpoints.
interface CapiErrorBody {
  errors?: Array<{ detail?: string; title?: string; code?: number | string }>;
  error?: string;
}

/**
 * Signal-native replacement for the ngrx internal-events bus.
 *
 * Holds per-endpoint error HISTORY (newest first), the single source of truth
 * for both the page-header endpoint-error banner and the `/errors/:endpointId`
 * detail page. Replaces `internal-events.reducer` + `InternalEventMonitor`,
 * which were fed by the request pipeline (SendEventAction) being removed.
 *
 * Fed centrally from the signal data layer: each orchestrator-backed page wires
 * an effect that calls `recordEndpointErrors(orchestrator.errorsByCnsi())` (see
 * `wireEndpointErrorReporting`). `recordEndpointErrors` appends a new event only
 * when an endpoint's error CHANGES, so a persistent error isn't re-appended on
 * every effect tick — giving a meaningful history rather than a flood.
 */
@Injectable({ providedIn: 'root' })
export class EndpointErrorEventsService {
  private readonly _byEndpoint = signal<Map<string, InternalEventState[]>>(new Map());
  readonly eventsByEndpoint: Signal<ReadonlyMap<string, InternalEventState[]>> = this._byEndpoint.asReadonly();

  // Last-appended error signature per endpoint — dedups a persistent error
  // across repeated identical errorsByCnsi snapshots. Plain Map (internal,
  // non-reactive); reset for an endpoint when its error clears so a recurrence
  // is recorded as a fresh event.
  private readonly lastSignature = new Map<string, string>();

  /** Per-endpoint error history (newest first), as a reactive signal. */
  errorsForEndpoint(endpointGuid: string): Signal<InternalEventState[]> {
    return computed(() => this._byEndpoint().get(endpointGuid) ?? []);
  }

  /**
   * Record the current per-endpoint error snapshot from a signal data source
   * (e.g. `MergeOrchestrator.errorsByCnsi()`). Appends a new event for each
   * endpoint whose error differs from the last one recorded; endpoints absent
   * from the snapshot keep their history (it clears only via `clearEndpoint`,
   * matching the old bus's CLEAR_ENDPOINT_ERROR_EVENTS semantics).
   */
  recordEndpointErrors(errorsByCnsi: ReadonlyMap<string, unknown>): void {
    errorsByCnsi.forEach((err, endpointGuid) => {
      const event = toInternalEventState(err);
      const sig = `${event.eventCode}|${event.message}|${event.metadata?.url ?? ''}`;
      if (this.lastSignature.get(endpointGuid) === sig) {
        return;
      }
      this.lastSignature.set(endpointGuid, sig);
      this._byEndpoint.update(curr => {
        const next = new Map(curr);
        next.set(endpointGuid, [event, ...(next.get(endpointGuid) ?? [])]);
        return next;
      });
    });
    // Drop the dedup signature for endpoints whose error cleared, so a future
    // recurrence is recorded afresh. History itself is retained.
    for (const guid of [...this.lastSignature.keys()]) {
      if (!errorsByCnsi.has(guid)) {
        this.lastSignature.delete(guid);
      }
    }
  }

  /** Dismiss all recorded errors for an endpoint (error-page dismiss control). */
  clearEndpoint(endpointGuid: string): void {
    this.lastSignature.delete(endpointGuid);
    this._byEndpoint.update(curr => {
      if (!curr.has(endpointGuid)) {
        return curr;
      }
      const next = new Map(curr);
      next.delete(endpointGuid);
      return next;
    });
  }
}

// Derive an InternalEventState from whatever a source's error() signal holds —
// typically an HttpErrorResponse. eventCode is the HTTP status (so the banner's
// `>= 500` filter and the error page's `5xx` filter keep working); message is a
// human-readable detail extracted from the CAPI/Stratos error body.
function toInternalEventState(err: unknown): InternalEventState<InternalEventStateMetadata> {
  const status = err instanceof HttpErrorResponse ? err.status : 0;
  const url = err instanceof HttpErrorResponse ? (err.url ?? '') : '';
  return {
    eventCode: status ? String(status) : '500',
    severity: InternalEventSeverity.ERROR,
    message: formatEndpointErrorDetail(err),
    timestamp: Date.now(),
    metadata: {
      url,
      httpMethod: '',
      errorResponse: err,
    },
  };
}

/**
 * Best-effort extraction of a human-readable error string. Tries (in order):
 * CAPI v3 `{errors:[{detail}]}`, Stratos `{error:"..."}`, HttpErrorResponse
 * status line, native Error.message, String coercion.
 */
function formatEndpointErrorDetail(err: unknown): string {
  if (err == null) {
    return 'failed to load';
  }
  if (err instanceof HttpErrorResponse) {
    const body = err.error as CapiErrorBody | string | null | undefined;
    if (body && typeof body === 'object') {
      if (body.errors?.[0]?.detail) {
        return body.errors[0].detail;
      }
      if (typeof body.error === 'string') {
        return body.error;
      }
    }
    if (typeof body === 'string' && body.length > 0) {
      return body;
    }
    return `${err.status} ${err.statusText || 'failed to load'}`.trim();
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}
