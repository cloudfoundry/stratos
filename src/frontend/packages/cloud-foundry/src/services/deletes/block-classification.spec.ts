import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { StratosJobError } from '../async-jobs/async-job.types';
import { classifyBlock } from './block-classification';

// Builds a CF-style HttpErrorResponse the way Angular surfaces a rejected
// observable: status + an `error` body carrying the CF error envelope.
const httpError = (status: number, body: unknown): HttpErrorResponse =>
  new HttpErrorResponse({ status, error: body, statusText: 'error' });

// CF v3 error envelope shape: { errors: [{ code, title, detail }] }.
const cfBody = (title: string, detail = '') => ({ errors: [{ code: 10000, title, detail }] });

const jobError = (code: string, message: string): StratosJobError =>
  new StratosJobError({
    id: 'j1', kind: 'cf.delete', state: 'FAILED', startedAt: '', updatedAt: '',
    errors: [{ code, message }],
  });

describe('classifyBlock', () => {
  describe('HttpErrorResponse', () => {
    it('422 CF-AssociationNotEmpty → has-dependents', () => {
      expect(classifyBlock(httpError(422, cfBody('CF-AssociationNotEmpty',
        'Please delete the spaces associations for your organizations.')))).toBe('has-dependents');
    });

    it('403 → forbidden', () => {
      expect(classifyBlock(httpError(403, cfBody('CF-NotAuthorized')))).toBe('forbidden');
    });

    it('409 async operation in progress → operation-in-progress', () => {
      expect(classifyBlock(httpError(409, cfBody('CF-AsyncServiceInstanceOperationInProgress',
        'An operation for service instance x is in progress.')))).toBe('operation-in-progress');
    });

    it('422 with an in-progress message → operation-in-progress', () => {
      expect(classifyBlock(httpError(422, cfBody('CF-AsyncServiceInstanceOperationInProgress')))).toBe('operation-in-progress');
    });

    it('generic 422 validation error → undefined (stays a failure)', () => {
      expect(classifyBlock(httpError(422, cfBody('CF-UnprocessableEntity', 'name is too long')))).toBeUndefined();
    });

    it('500 → undefined (transient, retryable)', () => {
      expect(classifyBlock(httpError(500, cfBody('CF-ServerError')))).toBeUndefined();
    });
  });

  describe('StratosJobError (polled FAILED job)', () => {
    it('association_not_empty message → has-dependents', () => {
      expect(classifyBlock(jobError('http.422', 'association_not_empty: spaces remain'))).toBe('has-dependents');
    });

    it('http.403 code → forbidden', () => {
      expect(classifyBlock(jobError('http.403', 'forbidden'))).toBe('forbidden');
    });

    it('operation-in-progress message → operation-in-progress', () => {
      expect(classifyBlock(jobError('http.409', 'last_operation still in progress'))).toBe('operation-in-progress');
    });

    it('internal error → undefined', () => {
      expect(classifyBlock(jobError('cf.500', 'internal error'))).toBeUndefined();
    });
  });

  describe('non-classifiable inputs', () => {
    it('plain Error → undefined', () => {
      expect(classifyBlock(new Error('boom'))).toBeUndefined();
    });

    it('null / undefined → undefined', () => {
      expect(classifyBlock(null)).toBeUndefined();
      expect(classifyBlock(undefined)).toBeUndefined();
    });
  });
});
