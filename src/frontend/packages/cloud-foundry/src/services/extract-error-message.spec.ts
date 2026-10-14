import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { StratosJobError } from './async-jobs/async-job.types';
import { extractHttpErrorMessage } from './extract-error-message';

const httpError = (error: unknown, status = 502, statusText = 'Bad Gateway'): HttpErrorResponse =>
  new HttpErrorResponse({ error, status, statusText });

const html504 = 'Status Code: 504 Gateway Timeout, Body: <html><body><h1>504 Gateway Time-out</h1>\nThe server didn\'t respond in time.\n</body></html>';
const stripped504 = 'Status Code: 504 Gateway Timeout, Body: 504 Gateway Time-out The server didn\'t respond in time.';

describe('extractHttpErrorMessage', () => {
  it('reads the same message from a failed job on either path', () => {
    const errors = [{ code: 'cf.v3.10009', message: 'CF-UnableToPerform', detail: html504 }];
    const polled = new StratosJobError({ id: 'j', kind: 'k', state: 'FAILED', startedAt: '', updatedAt: '', errors });
    const fast = httpError({ state: 'FAILED', errors });
    expect(extractHttpErrorMessage(fast)).toBe(stripped504);
    expect(extractHttpErrorMessage(polled)).toBe(stripped504);
  });

  it('strips markup from a CF passthrough detail', () => {
    expect(extractHttpErrorMessage(httpError({ errors: [{ code: 10009, title: 'CF-UnableToPerform', detail: html504 }] })))
      .toBe(stripped504);
  });

  it('falls back to the CF title, then the top-level message or error', () => {
    expect(extractHttpErrorMessage(httpError({ errors: [{ code: 10010, title: 'CF-ResourceNotFound' }] })))
      .toBe('CF-ResourceNotFound');
    expect(extractHttpErrorMessage(httpError({ errors: [{ code: 'cf.v3.10010', message: 'CF-ResourceNotFound' }] })))
      .toBe('CF-ResourceNotFound');
    expect(extractHttpErrorMessage(httpError({ error: 'endpoint not found' }))).toBe('endpoint not found');
  });

  it('names the HTTP status when the body says nothing', () => {
    expect(extractHttpErrorMessage(httpError(null))).toBe('HTTP 502 Bad Gateway');
    expect(extractHttpErrorMessage(httpError(null, 500, 'OK'))).toBe('HTTP 500');
  });
});
