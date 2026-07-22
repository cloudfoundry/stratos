import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';
import { AutoscalerPolicyDataService } from './autoscaler-policy-data.service';

const ENDPOINT_GUID = 'cf-1';
const APP_GUID = 'app-1';
const POLICY_URL = `/pp/v1/autoscaler/apps/${APP_GUID}/policy`;

const samplePolicy = (): AppAutoscalerPolicyLocal => ({
  enabled: true,
  instance_min_count: 1,
  instance_max_count: 10,
  scaling_rules: [],
  scaling_rules_form: [],
  scaling_rules_map: {},
  schedules: {
    timezone: 'UTC',
    recurring_schedule: [],
    specific_date: [],
  },
});

describe('AutoscalerPolicyDataService', () => {
  let svc: AutoscalerPolicyDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AutoscalerPolicyDataService,
      ],
    });
    svc = TestBed.inject(AutoscalerPolicyDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes empty signals before any load', () => {
    expect(svc.policy(ENDPOINT_GUID, APP_GUID)()).toBeNull();
    expect(svc.loading(ENDPOINT_GUID, APP_GUID)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).toBeNull();
    expect(svc.noPolicy(ENDPOINT_GUID, APP_GUID)()).toBe(false);
  });

  it('load() fires GET with cnsi headers and stores transformed policy', async () => {
    const promise = svc.load(ENDPOINT_GUID, APP_GUID);

    const req = httpMock.expectOne(POLICY_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('x-cap-api-host')).toBe('autoscaler');
    expect(req.request.headers.get('x-cap-passthrough')).toBe('true');
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe(ENDPOINT_GUID);

    req.flush({
      instance_min_count: 1,
      instance_max_count: 10,
      scaling_rules: [],
      schedules: { timezone: 'UTC', recurring_schedule: [], specific_date: [] },
    });
    await promise;

    const policy = svc.policy(ENDPOINT_GUID, APP_GUID)();
    expect(policy).not.toBeNull();
    expect(policy?.instance_min_count).toBe(1);
    expect(policy?.instance_max_count).toBe(10);
    // transform adds derived fields
    expect(policy?.scaling_rules_map).toEqual({});
    expect(svc.loading(ENDPOINT_GUID, APP_GUID)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).toBeNull();
    expect(svc.noPolicy(ENDPOINT_GUID, APP_GUID)()).toBe(false);
  });

  it('load() captures 404 as noPolicy, not as error', async () => {
    const promise = svc.load(ENDPOINT_GUID, APP_GUID);
    httpMock.expectOne(POLICY_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });
    await promise;

    expect(svc.policy(ENDPOINT_GUID, APP_GUID)()).toBeNull();
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).toBeNull();
    expect(svc.noPolicy(ENDPOINT_GUID, APP_GUID)()).toBe(true);
  });

  it('load() captures non-404 errors on the error signal', async () => {
    const promise = svc.load(ENDPOINT_GUID, APP_GUID);
    httpMock.expectOne(POLICY_URL).flush('boom', { status: 500, statusText: 'Internal Server Error' });
    await promise;

    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).not.toBeNull();
    expect(svc.noPolicy(ENDPOINT_GUID, APP_GUID)()).toBe(false);
  });

  it('update() PUTs the transformed policy and refreshes signals', async () => {
    const promise = svc.update(ENDPOINT_GUID, APP_GUID, samplePolicy());

    const req = httpMock.expectOne(POLICY_URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe(ENDPOINT_GUID);
    // PUT payload should be the wire shape (instance counts + transformed
    // arrays), not the local map shape used by forms.
    expect(req.request.body.instance_min_count).toBe(1);
    expect(req.request.body.instance_max_count).toBe(10);
    expect(req.request.body.scaling_rules_map).toBeUndefined();
    expect(req.request.body.scaling_rules_form).toBeUndefined();

    req.flush({
      instance_min_count: 2,
      instance_max_count: 20,
      scaling_rules: [],
      schedules: { timezone: 'UTC', recurring_schedule: [], specific_date: [] },
    });
    await promise;

    const policy = svc.policy(ENDPOINT_GUID, APP_GUID)();
    expect(policy?.instance_min_count).toBe(2);
    expect(policy?.instance_max_count).toBe(20);
    expect(svc.loading(ENDPOINT_GUID, APP_GUID)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).toBeNull();
  });

  it('update() surfaces error message on failure', async () => {
    const promise = svc.update(ENDPOINT_GUID, APP_GUID, samplePolicy());
    httpMock.expectOne(POLICY_URL).flush('boom', { status: 400, statusText: 'Bad Request' });
    await expect(promise).rejects.toBeTruthy();

    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).not.toBeNull();
    expect(svc.loading(ENDPOINT_GUID, APP_GUID)()).toBe(false);
  });

  it('detach() DELETEs and clears the policy', async () => {
    // seed with a loaded policy
    const loadP = svc.load(ENDPOINT_GUID, APP_GUID);
    httpMock.expectOne(POLICY_URL).flush({
      instance_min_count: 1, instance_max_count: 5,
      scaling_rules: [], schedules: { timezone: 'UTC', recurring_schedule: [], specific_date: [] },
    });
    await loadP;
    expect(svc.policy(ENDPOINT_GUID, APP_GUID)()).not.toBeNull();

    const detachP = svc.detach(ENDPOINT_GUID, APP_GUID);
    expect(svc.deleting(ENDPOINT_GUID, APP_GUID)()).toBe(true);
    const req = httpMock.expectOne(POLICY_URL);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    await detachP;

    expect(svc.policy(ENDPOINT_GUID, APP_GUID)()).toBeNull();
    expect(svc.noPolicy(ENDPOINT_GUID, APP_GUID)()).toBe(true);
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).toBeNull();
    expect(svc.deleting(ENDPOINT_GUID, APP_GUID)()).toBe(false);
    expect(svc.deletionError(ENDPOINT_GUID, APP_GUID)()).toBeNull();
  });

  it('detach() surfaces deletionError + clears deleting on failure', async () => {
    const detachP = svc.detach(ENDPOINT_GUID, APP_GUID);
    expect(svc.deleting(ENDPOINT_GUID, APP_GUID)()).toBe(true);
    httpMock.expectOne(POLICY_URL).flush('boom', { status: 500, statusText: 'Internal Server Error' });
    await expect(detachP).rejects.toBeTruthy();

    expect(svc.deleting(ENDPOINT_GUID, APP_GUID)()).toBe(false);
    expect(svc.deletionError(ENDPOINT_GUID, APP_GUID)()).not.toBeNull();
    // detachment failure does not flip noPolicy or wipe an existing cache
    expect(svc.noPolicy(ENDPOINT_GUID, APP_GUID)()).toBe(false);
  });

  it('per-app state is isolated under a single endpoint', async () => {
    const p1 = svc.load(ENDPOINT_GUID, 'app-a');
    httpMock.expectOne(`/pp/v1/autoscaler/apps/app-a/policy`).flush({
      instance_min_count: 1, instance_max_count: 5,
      scaling_rules: [], schedules: { timezone: 'UTC', recurring_schedule: [], specific_date: [] },
    });
    await p1;

    const p2 = svc.load(ENDPOINT_GUID, 'app-b');
    httpMock.expectOne(`/pp/v1/autoscaler/apps/app-b/policy`).flush('Not Found', { status: 404, statusText: 'Not Found' });
    await p2;

    expect(svc.policy(ENDPOINT_GUID, 'app-a')()).not.toBeNull();
    expect(svc.policy(ENDPOINT_GUID, 'app-b')()).toBeNull();
    expect(svc.noPolicy(ENDPOINT_GUID, 'app-b')()).toBe(true);
  });
});
