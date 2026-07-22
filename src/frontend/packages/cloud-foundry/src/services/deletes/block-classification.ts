import { HttpErrorResponse } from '@angular/common/http';
import { StratosJobError } from '../async-jobs/async-job.types';
import type { BlockReason } from './delete-event.types';

// Mechanism-owned default classification of a delete failure into a `blocked`
// reason (the design's "stop — don't auto-retry until resolved" cases). A
// caller may still promote any other failure to blocked itself; this only
// covers the universal CF cases so every caller gets them for free.
//
// Returns undefined for transient/retryable errors (network, 5xx, generic
// validation) — those stay `failure`.

interface ErrorSignal {
  /** HTTP status if recoverable, else 0. */
  status: number;
  /** Lower-cased blob of every human/code field, for keyword matching. */
  text: string;
}

// writeWithJob throws one of two shapes: an HttpErrorResponse (synchronous
// 4xx/5xx from the DELETE observable) or a StratosJobError (polled FAILED
// job). Normalise both to a status + searchable text blob so the classifier
// reasons over one shape.
function extractSignal(error: unknown): ErrorSignal {
  if (error instanceof HttpErrorResponse) {
    const parts: string[] = [String(error.statusText ?? '')];
    const body = error.error;
    if (body && typeof body === 'object') {
      const errors = (body as { errors?: Array<Record<string, unknown>> }).errors;
      errors?.forEach(e => parts.push(String(e.code ?? ''), String(e.title ?? ''),
        String(e.detail ?? ''), String(e.message ?? '')));
      const top = body as { message?: unknown; error?: unknown };
      parts.push(String(top.message ?? ''), String(top.error ?? ''));
    } else if (typeof body === 'string') {
      parts.push(body);
    }
    return { status: error.status, text: parts.join(' ').toLowerCase() };
  }

  if (error instanceof StratosJobError) {
    const parts: string[] = [];
    let status = 0;
    error.job.errors?.forEach(e => {
      parts.push(String(e.code ?? ''), String(e.message ?? ''), String(e.detail ?? ''));
      // write-with-job stamps synthesised codes as `http.<status>`.
      const m = /^http\.(\d{3})$/.exec(String(e.code ?? ''));
      if (m) status = Number(m[1]);
    });
    return { status, text: parts.join(' ').toLowerCase() };
  }

  if (error instanceof Error) {
    return { status: 0, text: error.message.toLowerCase() };
  }
  return { status: 0, text: '' };
}

export function classifyBlock(error: unknown): BlockReason | undefined {
  const { status, text } = extractSignal(error);

  if (status === 403) return 'forbidden';

  // CF surfaces a long-running last_operation as 409 or via a *OperationInProgress
  // error title; recognise either so a delete racing an in-flight op latches
  // rather than hammering the API.
  if (status === 409
    || text.includes('operationinprogress')
    || text.includes('in progress')) {
    return 'operation-in-progress';
  }

  // CF-AssociationNotEmpty (422): the entity still has dependents the operator
  // must remove first — the canonical "has-dependents" block.
  if (text.includes('association')) return 'has-dependents';

  return undefined;
}
