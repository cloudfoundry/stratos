import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
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
});
