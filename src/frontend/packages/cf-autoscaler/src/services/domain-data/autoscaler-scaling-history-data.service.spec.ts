import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AutoscalerScalingHistoryDataService } from './autoscaler-scaling-history-data.service';

const ENDPOINT_GUID = 'cf-1';
const APP_GUID = 'app-1';
const HISTORY_URL = `/pp/v1/autoscaler/apps/${APP_GUID}/event`;

const SAMPLE_PARAMS = {
  'start-time': '0',
  'end-time': '1700000000000000000',
  page: '1',
  'results-per-page': '5',
  'order-direction': 'desc',
};

const SAMPLE_RESPONSE = {
  total_results: 2,
  total_pages: 1,
  prev_url: '',
  next_url: '',
  resources: [
    {
      app_id: APP_GUID,
      timestamp: 1699999999000000000,
      scaling_type: 0,
      status: 0,
      reason: 'reason-a',
      message: 'msg-a',
      old_instances: 1,
      new_instances: 2,
      error: '',
    },
    {
      app_id: APP_GUID,
      timestamp: 1699999998000000000,
      scaling_type: 1,
      status: 0,
      reason: 'reason-b',
      message: '',
      old_instances: 2,
      new_instances: 1,
      error: '',
    },
  ],
};

describe('AutoscalerScalingHistoryDataService', () => {
  let svc: AutoscalerScalingHistoryDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AutoscalerScalingHistoryDataService,
      ],
    });
    svc = TestBed.inject(AutoscalerScalingHistoryDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes empty signals before any operation', () => {
    expect(svc.events(ENDPOINT_GUID, APP_GUID)()).toEqual([]);
    expect(svc.totalResults(ENDPOINT_GUID, APP_GUID)()).toBe(0);
    expect(svc.totalPages(ENDPOINT_GUID, APP_GUID)()).toBe(0);
    expect(svc.loading(ENDPOINT_GUID, APP_GUID)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).toBeNull();
  });

  it('load() fires GET with cnsi headers and query params', async () => {
    const promise = svc.load(ENDPOINT_GUID, APP_GUID, SAMPLE_PARAMS);

    expect(svc.loading(ENDPOINT_GUID, APP_GUID)()).toBe(true);

    const req = httpMock.expectOne(r => r.url === HISTORY_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('x-cap-api-host')).toBe('autoscaler');
    expect(req.request.headers.get('x-cap-passthrough')).toBe('true');
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe(ENDPOINT_GUID);
    expect(req.request.params.get('start-time')).toBe('0');
    expect(req.request.params.get('end-time')).toBe('1700000000000000000');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('results-per-page')).toBe('5');
    expect(req.request.params.get('order-direction')).toBe('desc');

    req.flush(SAMPLE_RESPONSE);
    await promise;

    expect(svc.events(ENDPOINT_GUID, APP_GUID)().length).toBe(2);
    expect(svc.events(ENDPOINT_GUID, APP_GUID)()[0].reason).toBe('reason-a');
    expect(svc.totalResults(ENDPOINT_GUID, APP_GUID)()).toBe(2);
    expect(svc.totalPages(ENDPOINT_GUID, APP_GUID)()).toBe(1);
    expect(svc.loading(ENDPOINT_GUID, APP_GUID)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).toBeNull();
  });

  it('load() with no params still issues a GET (no query params required)', async () => {
    const promise = svc.load(ENDPOINT_GUID, APP_GUID);

    const req = httpMock.expectOne(r => r.url === HISTORY_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);

    req.flush(SAMPLE_RESPONSE);
    await promise;

    expect(svc.events(ENDPOINT_GUID, APP_GUID)().length).toBe(2);
  });

  it('load() captures error on the error signal and rejects', async () => {
    const promise = svc.load(ENDPOINT_GUID, APP_GUID, SAMPLE_PARAMS);
    httpMock.expectOne(r => r.url === HISTORY_URL).flush('boom', {
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(promise).rejects.toBeDefined();
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).not.toBeNull();
    expect(svc.loading(ENDPOINT_GUID, APP_GUID)()).toBe(false);
    expect(svc.events(ENDPOINT_GUID, APP_GUID)()).toEqual([]);
  });

  it('load() replaces previously cached events on subsequent fetch', async () => {
    const p1 = svc.load(ENDPOINT_GUID, APP_GUID, SAMPLE_PARAMS);
    httpMock.expectOne(r => r.url === HISTORY_URL).flush(SAMPLE_RESPONSE);
    await p1;
    expect(svc.events(ENDPOINT_GUID, APP_GUID)().length).toBe(2);

    const p2 = svc.load(ENDPOINT_GUID, APP_GUID, SAMPLE_PARAMS);
    httpMock.expectOne(r => r.url === HISTORY_URL).flush({
      total_results: 0,
      total_pages: 0,
      prev_url: '',
      next_url: '',
      resources: [],
    });
    await p2;

    expect(svc.events(ENDPOINT_GUID, APP_GUID)()).toEqual([]);
    expect(svc.totalResults(ENDPOINT_GUID, APP_GUID)()).toBe(0);
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).toBeNull();
  });

  it('per-(endpoint,app) state is isolated', async () => {
    const p1 = svc.load('cf-a', 'app-x');
    httpMock.expectOne('/pp/v1/autoscaler/apps/app-x/event').flush({
      total_results: 1,
      total_pages: 1,
      prev_url: '',
      next_url: '',
      resources: [{ ...SAMPLE_RESPONSE.resources[0], app_id: 'app-x', reason: 'rx' }],
    });
    await p1;

    const p2 = svc.load('cf-b', 'app-y');
    httpMock.expectOne('/pp/v1/autoscaler/apps/app-y/event').flush({
      total_results: 1,
      total_pages: 1,
      prev_url: '',
      next_url: '',
      resources: [{ ...SAMPLE_RESPONSE.resources[0], app_id: 'app-y', reason: 'ry' }],
    });
    await p2;

    expect(svc.events('cf-a', 'app-x')()[0].reason).toBe('rx');
    expect(svc.events('cf-b', 'app-y')()[0].reason).toBe('ry');
    expect(svc.events('cf-a', 'app-y')()).toEqual([]);
  });
});
