import { describe, it, expect } from 'vitest';
import { StratosJobError, StratosJob } from './async-job.types';

const job = (errors: StratosJob['errors']): StratosJob => ({
  id: 'j-1', kind: 'cf.service_key.create', state: 'FAILED', startedAt: 't', updatedAt: 't', errors,
});

describe('StratosJobError message', () => {
  it('reads as the CF title followed by the detail, with any markup in the detail stripped', () => {
    const err = new StratosJobError(job([{
      code: 'cf.v3.10009',
      message: 'CF-UnableToPerform',
      detail: 'bind could not be completed: Status Code: 504 Gateway Timeout, Body: <html><body><h1>504 Gateway Time-out</h1>\nThe server didn\'t respond in time.\n</body></html>',
    }]));
    expect(err.message).toBe(
      'CF-UnableToPerform. bind could not be completed: Status Code: 504 Gateway Timeout, Body: 504 Gateway Time-out The server didn\'t respond in time.',
    );
  });

  it('falls back to code and title when there is no detail', () => {
    expect(new StratosJobError(job([{ code: 'cf.v3.10010', message: 'CF-ResourceNotFound' }])).message)
      .toBe('cf.v3.10010: CF-ResourceNotFound');
    expect(new StratosJobError(job(undefined)).message).toBe('job j-1 failed');
  });
});
