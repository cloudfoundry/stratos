// Spec for RevisionsService — verifies URL patterns and writeWithJob integration.
//
// Uses provideHttpClient + provideHttpClientTesting + HttpTestingController
// (Angular 15+ pattern; HttpClientTestingModule is deprecated).
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RevisionsResponse, RollbackResult } from './revisions.service';
import { RevisionsService } from './revisions.service';

describe('RevisionsService', () => {
  let svc: RevisionsService;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RevisionsService,
      ],
    });
    svc = TestBed.inject(RevisionsService);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  // ── listRevisions ──────────────────────────────────────────────────────────

  it('GETs the correct URL for listRevisions', () => {
    const stub: RevisionsResponse = {
      revisions: [],
      featureEnabled: true,
      partial: { deployedUnknown: false, featureUnknown: false },
    };

    let result: RevisionsResponse | undefined;
    svc.listRevisions('cnsi-1', 'app-1').subscribe(r => (result = r));

    ctrl.expectOne('/pp/v1/cf/apps/cnsi-1/app-1/revisions').flush(stub);

    expect(result).toEqual(stub);
  });

  // ── rollback ───────────────────────────────────────────────────────────────

  it('POSTs to the correct rollback URL with revisionGuid and strategy', async () => {
    const terminal: RollbackResult = {
      appGuid: 'app-1',
      revisionGuid: 'rev-1',
      strategy: 'rolling',
      deploymentGuid: 'dep-1',
      stages: [],
    };

    // Start the rollback — writeWithJob awaits the observable; flush via ctrl.
    const promise = svc.rollback('cnsi-1', 'app-1', 'rev-1', { strategy: 'rolling' });

    const req = ctrl.expectOne('/pp/v1/cf/apps/cnsi-1/app-1/rollback');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({ revisionGuid: 'rev-1', strategy: 'rolling' });

    // 200 fast-path: backend resolved synchronously within the fast-path window.
    req.flush(terminal, { status: 200, statusText: 'OK' });

    const result = await promise;
    expect(result.status).toBe('COMPLETE');
    expect(result.state).toEqual(terminal);
  });

  it('resolves AsyncJobResult<RollbackResult> on 200 fast-path COMPLETE', async () => {
    const terminal: RollbackResult = {
      appGuid: 'app-1',
      revisionGuid: 'rev-42',
      strategy: 'rolling',
      deploymentGuid: 'dep-42',
      stages: [],
    };

    const promise = svc.rollback('cnsi-1', 'app-1', 'rev-42');

    ctrl.expectOne('/pp/v1/cf/apps/cnsi-1/app-1/rollback').flush(terminal, { status: 200, statusText: 'OK' });

    const result = await promise;
    expect(result.status).toBe('COMPLETE');
    expect(result.state?.appGuid).toBe('app-1');
    expect(result.state?.deploymentGuid).toBe('dep-42');
  });

  it('includes maxInFlight and canarySteps in the POST body when supplied', async () => {
    const terminal: RollbackResult = {
      appGuid: 'app-1',
      revisionGuid: 'rev-1',
      strategy: 'canary',
      deploymentGuid: 'dep-1',
      stages: [],
    };

    const promise = svc.rollback('cnsi-1', 'app-1', 'rev-1', {
      strategy: 'canary',
      maxInFlight: 2,
      canarySteps: [10, 25, 50],
    });

    const req = ctrl.expectOne('/pp/v1/cf/apps/cnsi-1/app-1/rollback');
    expect(req.request.body).toMatchObject({
      revisionGuid: 'rev-1',
      strategy: 'canary',
      maxInFlight: 2,
      canarySteps: [10, 25, 50],
    });

    req.flush(terminal, { status: 200, statusText: 'OK' });
    await promise;
  });
});
