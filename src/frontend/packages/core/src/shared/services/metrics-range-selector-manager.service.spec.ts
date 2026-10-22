import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MetricQueryConfig, MetricQueryType, MetricsRequest } from '@stratosui/store';

import { MetricsRangeSelectorManagerService } from './metrics-range-selector-manager.service';
import { MetricsRangeSelectorService } from './metrics-range-selector.service';

describe('MetricsRangeSelectorManagerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MetricsRangeSelectorManagerService,
        MetricsRangeSelectorService,
        provideZonelessChangeDetection(),
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    const service = TestBed.inject(MetricsRangeSelectorManagerService);
    expect(service).toBeTruthy();
  });

  it('re-requests a moving window and ticks the app on every poll', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T12:00:00Z'));
    const manager = TestBed.inject(MetricsRangeSelectorManagerService);
    const tick = vi.spyOn(TestBed.inject(ApplicationRef), 'tick').mockImplementation(() => undefined);
    const requests: MetricsRequest[] = [];
    manager.request$.subscribe(request => requests.push(request));

    manager.init({
      endpointGuid: 'e1',
      url: '/pp/v1/metrics/test',
      query: new MetricQueryConfig('up'),
      queryType: MetricQueryType.QUERY,
      windowValue: '1:hour',
    });
    // Choosing the window commits the first request at once.
    expect(requests.length).toBe(1);
    expect(tick).not.toHaveBeenCalled();

    vi.advanceTimersByTime(manager.pollInterval * 2);

    expect(requests.length).toBe(3);
    expect(tick).toHaveBeenCalledTimes(2);
    const ends = requests.map(request => request.query.params?.end);
    expect(ends[1] - ends[0]).toBe(manager.pollInterval / 1000);
    expect(ends[2] - ends[1]).toBe(manager.pollInterval / 1000);
    for (const request of requests) {
      expect(request.windowValue).toBe('1:hour');
      expect(request.query.params?.end - request.query.params?.start).toBe(60 * 60);
    }
  });

  it('stops polling when a custom range replaces the window', () => {
    vi.useFakeTimers();
    const manager = TestBed.inject(MetricsRangeSelectorManagerService);
    const tick = vi.spyOn(TestBed.inject(ApplicationRef), 'tick').mockImplementation(() => undefined);
    const requests = vi.fn();
    manager.request$.subscribe(requests);
    manager.init({
      endpointGuid: 'e1',
      url: '/pp/v1/metrics/test',
      query: new MetricQueryConfig('up'),
      queryType: MetricQueryType.QUERY,
      windowValue: '1:hour',
    });

    manager.selectedTimeRange = manager.times.find(time => !time.value)!;
    requests.mockClear();
    vi.advanceTimersByTime(manager.pollInterval * 3);

    expect(requests).not.toHaveBeenCalled();
    expect(tick).not.toHaveBeenCalled();
  });
});
