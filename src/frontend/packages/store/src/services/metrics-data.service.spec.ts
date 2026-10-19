import { provideHttpClient } from '@angular/common/http';
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
});
