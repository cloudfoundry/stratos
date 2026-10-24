import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, QueryList } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MetricQueryConfig, MetricQueryType, MetricsRequest } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@test-framework';

import { MetricsRangeSelectorManagerService } from '../../services/metrics-range-selector-manager.service';
import { MetricsRangeSelectorService } from '../../services/metrics-range-selector.service';
import { MetricsChartComponent } from '../metrics-chart/metrics-chart.component';
import { MetricsParentRangeSelectorComponent } from './metrics-parent-range-selector.component';

describe('MetricsParentRangeSelectorComponent', () => {
  let component: MetricsParentRangeSelectorComponent;
  let fixture: ComponentFixture<MetricsParentRangeSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MetricsParentRangeSelectorComponent,
        createBasicStoreModule(),
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        MetricsRangeSelectorService,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(MetricsParentRangeSelectorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('names its drop-down "Time window"', async () => {
    await fixture.whenStable();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector('[role="combobox"]');
    expect(trigger).toBeTruthy();
    expect(trigger!.getAttribute('aria-label')).toBe('Time window');
  });

  it('stops the window poll when the selector is destroyed', () => {
    vi.useFakeTimers();
    const manager = fixture.debugElement.injector.get(MetricsRangeSelectorManagerService);
    const tick = vi.spyOn(TestBed.inject(ApplicationRef), 'tick').mockImplementation(() => undefined);
    const requests = vi.fn();
    manager.request$.subscribe(requests);
    // A window range starts the 10 s poll that re-requests and ticks the app.
    manager.init({
      endpointGuid: 'e1',
      url: '/pp/v1/metrics/test',
      query: new MetricQueryConfig('up'),
      queryType: MetricQueryType.QUERY,
      windowValue: '1:hour',
    });
    vi.advanceTimersByTime(manager.pollInterval);
    expect(tick).toHaveBeenCalledTimes(1);

    fixture.destroy();
    tick.mockClear();
    requests.mockClear();
    vi.advanceTimersByTime(manager.pollInterval * 3);

    expect(tick).not.toHaveBeenCalled();
    expect(requests).not.toHaveBeenCalled();
  });

  it('gives every chart the windowed request as soon as the charts are known', () => {
    vi.useFakeTimers();
    const base: MetricsRequest = {
      endpointGuid: 'e1',
      url: '/pp/v1/metrics/cf/app/a1',
      query: new MetricQueryConfig('firehose_container_metric_cpu_percentage'),
      queryType: MetricQueryType.RANGE_QUERY,
      windowValue: '1:hour',
    };
    const charts = [0, 1].map(() => {
      const chart = { metricsConfig: () => ({ request: base }), currentRequest: base, applyRequest: vi.fn() };
      chart.applyRequest.mockImplementation((req: MetricsRequest) => chart.currentRequest = req);
      return chart;
    });
    const list = new QueryList<MetricsChartComponent>();
    list.reset(charts as unknown as MetricsChartComponent[]);
    (component as unknown as { metricsCharts: QueryList<MetricsChartComponent> }).metricsCharts = list;

    // No timer has run: the first request has to come from choosing the
    // window, not from the first 10 s poll.
    component.ngAfterContentInit();

    for (const chart of charts) {
      expect(chart.applyRequest).toHaveBeenCalledTimes(1);
      const params = chart.currentRequest.query.params;
      expect(params?.start).toBeTypeOf('number');
      expect(params?.end).toBeTypeOf('number');
      expect(chart.currentRequest.windowValue).toBe('1:hour');
    }
  });
});
