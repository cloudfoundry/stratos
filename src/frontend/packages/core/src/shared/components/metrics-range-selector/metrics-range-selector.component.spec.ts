import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from "@test-framework/core-test.helper";
import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../core/core.module';
import { MetricQueryConfig, MetricQueryType, MetricsRequest } from '@stratosui/store';
import { MetricsRangeSelectorService } from '../../services/metrics-range-selector.service';
import { ITimeRange } from '../../services/metrics-range-selector.types';
import { MetricsRangeSelectorComponent } from './metrics-range-selector.component';

describe('MetricsRangeSelectorComponent', () => {
  let component: MetricsRangeSelectorComponent;
  let fixture: ComponentFixture<MetricsRangeSelectorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MetricsRangeSelectorComponent,
        CoreModule,
        CoreTestingModule,
        createBasicStoreModule(),
        NoopAnimationsModule,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        MetricsRangeSelectorService,
        provideZonelessChangeDetection(),
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(MetricsRangeSelectorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
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

  // The metrics chart calls start() in code, and that starts the manager:
  // it picks the time window and begins polling. Options bound in the template
  // have to be in place by then.
  it('applies its options before the base request starts the manager', async () => {
    const times: ITimeRange[] = [
      { value: '5:minute', label: '5 minutes', queryType: MetricQueryType.QUERY },
      { value: '30:minute', label: '30 minutes', queryType: MetricQueryType.QUERY },
    ];
    fixture.componentRef.setInput('times', times);
    fixture.componentRef.setInput('selectedTimeValue', '30:minute');
    fixture.componentRef.setInput('pollInterval', 5000);

    component.start({
      endpointGuid: 'endpoint',
      url: 'query',
      query: new MetricQueryConfig('metric'),
      queryType: MetricQueryType.QUERY,
    } as MetricsRequest);

    const manager = component.rangeSelectorManager;
    expect(manager.times).toBe(times);
    expect(manager.pollInterval).toBe(5000);
    expect(manager.selectedTimeRange.value).toBe('30:minute');
  });

  it('applies an option that changes after the start', async () => {
    fixture.componentRef.setInput('pollInterval', 2000);
    await fixture.whenStable();

    expect(component.rangeSelectorManager.pollInterval).toBe(2000);
  });

  // #4166: the committed range dates were body text at opacity 0.6 (4.04:1 in light mode).
  it('shows the committed range dates in the muted text color', async () => {
    const manager = component.rangeSelectorManager;
    manager.selectedTimeRangeValue = { queryType: MetricQueryType.RANGE_QUERY } as ITimeRange;
    manager.committedStartEnd = [new Date(2026, 5, 1, 9, 0), new Date(2026, 5, 2, 9, 0)];
    // OnPush: the manager's fields are plain properties, so mark the view before checking it.
    fixture.debugElement.injector.get(ChangeDetectorRef).markForCheck();
    await fixture.whenStable();
    const dates = (fixture.nativeElement as HTMLElement).querySelector('.metrics-range-selector__selected-range-dates');
    expect(dates?.textContent).toContain('2026');
    expect(dates!.classList).toContain('text-content-muted');
  });
});
