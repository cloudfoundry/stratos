import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MetricQueryConfig } from '../actions/metrics.actions';
import { MetricQueryType } from '../types/metric.types';
import { MetricsDataService, MetricsRequest } from './metrics-data.service';

const request = (metric: string): MetricsRequest => ({
  endpointGuid: 'e1',
  url: '/pp/v1/metrics/test',
  query: new MetricQueryConfig(metric),
  queryType: MetricQueryType.QUERY,
  windowValue: null,
});

describe('MetricsDataService', () => {
  let service: MetricsDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(MetricsDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches when the request changes and on each poll', () => {
    const req = signal<MetricsRequest | null>(request('a'));
    const obs = service.observe(req, { pollIntervalMs: 1000 });
    TestBed.tick();
    expect(http.match(r => r.url.includes('query=a')).length).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(http.match(r => r.url.includes('query=a')).length).toBe(1);

    req.set(request('b'));
    TestBed.tick();
    expect(http.match(r => r.url.includes('query=b')).length).toBe(1);
    obs.stop();
  });

  it('stop() ends the observation: no fetch on a later request, no poll', () => {
    const req = signal<MetricsRequest | null>(request('a'));
    const obs = service.observe(req, { pollIntervalMs: 1000 });
    TestBed.tick();
    http.match(() => true);

    obs.stop();
    req.set(request('b'));
    TestBed.tick();
    vi.advanceTimersByTime(5000);

    http.expectNone(() => true);
    expect(vi.getTimerCount()).toBe(0);
  });

  // The metrics plugin answers 200 with one entry per endpoint; a failed
  // query is that endpoint's error entry, not missing data.
  it('fetch rejects with the endpoint\'s status and reason for its error entry', async () => {
    const fetching = service.fetch(request('a'));
    http.expectOne(r => r.url.includes('query=a')).flush({
      e1: { error: { statusCode: 503, status: '503 Service Unavailable' }, errorResponse: 'prometheus is down' },
    });
    const err = await fetching.catch((e: unknown) => e);
    expect(err).toBeInstanceOf(HttpErrorResponse);
    expect((err as HttpErrorResponse).status).toBe(503);
    expect((err as HttpErrorResponse).error).toBe('503 Service Unavailable: prometheus is down');
  });

  it('observe reports the error entry\'s reason', async () => {
    const obs = service.observe(signal<MetricsRequest | null>(request('a')));
    TestBed.tick();
    http.expectOne(r => r.url.includes('query=a')).flush({
      e1: { error: { statusCode: 500, status: 'Error proxying request' }, errorResponse: 'dial tcp: i/o timeout' },
    });
    await vi.waitFor(() => expect(obs.error()).toBe('Error proxying request: dial tcp: i/o timeout (500)'));
    expect(obs.metrics()).toBeNull();
    obs.stop();
  });
});
