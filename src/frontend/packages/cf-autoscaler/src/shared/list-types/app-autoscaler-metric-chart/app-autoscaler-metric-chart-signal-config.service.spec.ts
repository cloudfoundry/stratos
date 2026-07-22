import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppAutoscalerPolicy } from '../../../store/app-autoscaler.types';
import {
  AppAutoscalerMetricChartSignalConfigService,
  METRIC_CHART_TIME_WINDOWS,
} from './app-autoscaler-metric-chart-signal-config.service';

const CNSI = 'cnsi-1';
const APP = 'app-1';
const POLICY_URL = `/pp/v1/autoscaler/apps/${APP}/policy`;

// Minimal valid policy with two scaling rules so `scaling_rules_map`
// (built by autoscalerTransformArrayToMap) yields two trigger rows. The
// transform groups by `metric_type`, so two distinct types → two rows.
const policyResponse = (): AppAutoscalerPolicy => ({
  instance_min_count: 1,
  instance_max_count: 5,
  scaling_rules: [
    { metric_type: 'memoryused', operator: '>', threshold: 80, adjustment: '+1' },
    { metric_type: 'cpu', operator: '>', threshold: 50, adjustment: '+2' },
  ],
});

describe('AppAutoscalerMetricChartSignalConfigService', () => {
  let svc: AppAutoscalerMetricChartSignalConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AppAutoscalerMetricChartSignalConfigService,
      ],
    });
    svc = TestBed.inject(AppAutoscalerMetricChartSignalConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts empty and not loaded', () => {
    svc.initialize(CNSI, APP);
    expect(svc.rows()).toEqual([]);
    expect(svc.hasLoadedOnce()).toBe(false);
    expect(svc.view.totalFilteredResults()).toBe(0);
  });

  it('loadAll() fetches the policy and exposes one row per metric type', async () => {
    svc.initialize(CNSI, APP);
    const promise = svc.loadAll();

    const req = httpMock.expectOne(POLICY_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('x-cap-api-host')).toBe('autoscaler');
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe(CNSI);

    req.flush(policyResponse());
    await promise;

    expect(svc.hasLoadedOnce()).toBe(true);
    expect(svc.rows().length).toBe(2);
    // Each row should carry an `entity.query.params` window the chart
    // card can consume (start < end, both in seconds).
    const row = svc.rows()[0];
    expect(row.entity.query?.params?.start).toBeGreaterThan(0);
    expect(row.entity.query?.params?.end).toBeGreaterThan(row.entity.query!.params!.start);
  });

  it('nameFilter narrows rows by metric-type substring', async () => {
    const appRef = TestBed.inject(ApplicationRef);
    svc.initialize(CNSI, APP);
    const promise = svc.loadAll();
    httpMock.expectOne(POLICY_URL).flush(policyResponse());
    await promise;

    // Effect bound by initialize() flushes via appRef.tick(); without it
    // the predicate stays at the identity () => true.
    svc.nameFilter.set('cpu');
    appRef.tick();
    expect(svc.view.totalFilteredResults()).toBe(1);

    svc.nameFilter.set('memory');
    appRef.tick();
    expect(svc.view.totalFilteredResults()).toBe(1);

    svc.nameFilter.set('');
    appRef.tick();
    expect(svc.view.totalFilteredResults()).toBe(2);
  });

  it('clearFilters resets nameFilter, sort, and pageIndex', () => {
    svc.initialize(CNSI, APP);
    svc.nameFilter.set('foo');
    svc.sort.set({ field: 'name', direction: 'desc' });
    svc.pageIndex.set(2);

    svc.clearFilters();

    expect(svc.nameFilter()).toBe('');
    expect(svc.sort().field).toBe('name');
    expect(svc.sort().direction).toBe('asc');
    expect(svc.pageIndex()).toBe(0);
  });

  it('setWindow swaps the active window and rebuilds the row range', async () => {
    svc.initialize(CNSI, APP);
    const promise = svc.loadAll();
    httpMock.expectOne(POLICY_URL).flush(policyResponse());
    await promise;

    const before = svc.rows()[0].entity.query!.params!;
    expect(svc.windowValue()).toBe(METRIC_CHART_TIME_WINDOWS[0].value);

    svc.setWindow('2:hour');
    const after = svc.rows()[0].entity.query!.params!;

    // Switching to a longer window pushes `start` further back. `end`
    // ticks to "now" so it may equal or slightly exceed the previous
    // value depending on test runtime — the start delta is the
    // load-bearing contract (drives the chart's x-axis range).
    expect(after.start).toBeLessThan(before.start);
  });

  it('refresh() re-issues the policy fetch', async () => {
    svc.initialize(CNSI, APP);
    const p1 = svc.loadAll();
    httpMock.expectOne(POLICY_URL).flush(policyResponse());
    await p1;

    const p2 = svc.refresh();
    httpMock.expectOne(POLICY_URL).flush(policyResponse());
    await p2;
  });
});
