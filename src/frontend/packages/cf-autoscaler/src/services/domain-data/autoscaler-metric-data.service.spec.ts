import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AutoscalerMetricDataService, AutoscalerMetricQueryParams } from './autoscaler-metric-data.service';

const ENDPOINT_GUID = 'cf-1';
const APP_GUID = 'app-1';
const METRIC_TYPE = 'memoryused';
const PARAMS: AutoscalerMetricQueryParams = {
  'start-time': '1000000000000000000',
  'end-time': '2000000000000000000',
  page: '1',
  'results-per-page': '10000',
  'order-direction': 'asc',
};

const baseUrl = `/pp/v1/autoscaler/apps/${APP_GUID}/metric/${METRIC_TYPE}`;

function urlMatcher(url: string): (req: { url: string }) => boolean {
  return (req) => req.url === url;
}

describe('AutoscalerMetricDataService', () => {
  let svc: AutoscalerMetricDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AutoscalerMetricDataService,
      ],
    });
    svc = TestBed.inject(AutoscalerMetricDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes empty signals before any operation', () => {
    expect(svc.metrics(ENDPOINT_GUID, APP_GUID, METRIC_TYPE)()).toEqual([]);
    expect(svc.loading(ENDPOINT_GUID, APP_GUID, METRIC_TYPE)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID, APP_GUID, METRIC_TYPE)()).toBeNull();
  });

  it('load() fires GET with cnsi headers and time-window params', async () => {
    const promise = svc.load(ENDPOINT_GUID, APP_GUID, METRIC_TYPE, PARAMS);

    const req = httpMock.expectOne(urlMatcher(baseUrl));
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('x-cap-api-host')).toBe('autoscaler');
    expect(req.request.headers.get('x-cap-passthrough')).toBe('true');
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe(ENDPOINT_GUID);
    expect(req.request.params.get('start-time')).toBe(PARAMS['start-time']);
    expect(req.request.params.get('end-time')).toBe(PARAMS['end-time']);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('results-per-page')).toBe('10000');
    expect(req.request.params.get('order-direction')).toBe('asc');

    req.flush({
      total_results: 2,
      total_pages: 1,
      page: 1,
      prev_url: null,
      next_url: null,
      resources: [
        { app_id: APP_GUID, name: METRIC_TYPE, timestamp: 1000, unit: 'MB', value: '10' },
        { app_id: APP_GUID, name: METRIC_TYPE, timestamp: 2000, unit: 'MB', value: '20' },
      ],
    });
    await promise;

    const data = svc.metrics(ENDPOINT_GUID, APP_GUID, METRIC_TYPE)();
    expect(data).toHaveLength(2);
    expect(data[0].value).toBe('10');
    expect(data[1].timestamp).toBe(2000);
    expect(svc.loading(ENDPOINT_GUID, APP_GUID, METRIC_TYPE)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID, APP_GUID, METRIC_TYPE)()).toBeNull();
  });

  it('load() captures error and leaves cached metrics empty', async () => {
    const promise = svc.load(ENDPOINT_GUID, APP_GUID, METRIC_TYPE, PARAMS);
    httpMock.expectOne(urlMatcher(baseUrl))
      .flush('boom', { status: 500, statusText: 'Internal Server Error' });

    await promise;
    expect(svc.metrics(ENDPOINT_GUID, APP_GUID, METRIC_TYPE)()).toEqual([]);
    expect(svc.error(ENDPOINT_GUID, APP_GUID, METRIC_TYPE)()).not.toBeNull();
    expect(svc.loading(ENDPOINT_GUID, APP_GUID, METRIC_TYPE)()).toBe(false);
  });

  it('per-(endpoint,app,metric) state is isolated', async () => {
    const p1 = svc.load('cf-a', 'app-x', 'memoryused', PARAMS);
    httpMock.expectOne(urlMatcher('/pp/v1/autoscaler/apps/app-x/metric/memoryused'))
      .flush({
        total_results: 1, total_pages: 1, page: 1, prev_url: null, next_url: null,
        resources: [{ app_id: 'app-x', name: 'memoryused', timestamp: 1, unit: 'MB', value: '1' }],
      });
    await p1;

    const p2 = svc.load('cf-b', 'app-y', 'cpu', PARAMS);
    httpMock.expectOne(urlMatcher('/pp/v1/autoscaler/apps/app-y/metric/cpu'))
      .flush({
        total_results: 1, total_pages: 1, page: 1, prev_url: null, next_url: null,
        resources: [{ app_id: 'app-y', name: 'cpu', timestamp: 1, unit: '%', value: '5' }],
      });
    await p2;

    expect(svc.metrics('cf-a', 'app-x', 'memoryused')()[0].value).toBe('1');
    expect(svc.metrics('cf-b', 'app-y', 'cpu')()[0].value).toBe('5');
    expect(svc.metrics('cf-a', 'app-y', 'memoryused')()).toEqual([]);
    expect(svc.metrics('cf-a', 'app-x', 'cpu')()).toEqual([]);
  });

  it('successive loads replace cached metrics for the same key', async () => {
    const p1 = svc.load(ENDPOINT_GUID, APP_GUID, METRIC_TYPE, PARAMS);
    httpMock.expectOne(urlMatcher(baseUrl)).flush({
      total_results: 1, total_pages: 1, page: 1, prev_url: null, next_url: null,
      resources: [{ app_id: APP_GUID, name: METRIC_TYPE, timestamp: 1, unit: 'MB', value: '1' }],
    });
    await p1;
    expect(svc.metrics(ENDPOINT_GUID, APP_GUID, METRIC_TYPE)()).toHaveLength(1);

    const p2 = svc.load(ENDPOINT_GUID, APP_GUID, METRIC_TYPE, PARAMS);
    httpMock.expectOne(urlMatcher(baseUrl)).flush({
      total_results: 3, total_pages: 1, page: 1, prev_url: null, next_url: null,
      resources: [
        { app_id: APP_GUID, name: METRIC_TYPE, timestamp: 10, unit: 'MB', value: '10' },
        { app_id: APP_GUID, name: METRIC_TYPE, timestamp: 20, unit: 'MB', value: '20' },
        { app_id: APP_GUID, name: METRIC_TYPE, timestamp: 30, unit: 'MB', value: '30' },
      ],
    });
    await p2;
    expect(svc.metrics(ENDPOINT_GUID, APP_GUID, METRIC_TYPE)()).toHaveLength(3);
    expect(svc.metrics(ENDPOINT_GUID, APP_GUID, METRIC_TYPE)()[2].value).toBe('30');
  });
});
