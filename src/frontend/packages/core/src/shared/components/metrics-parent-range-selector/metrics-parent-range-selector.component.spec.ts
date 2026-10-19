import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MetricQueryConfig, MetricQueryType } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@test-framework';

import { MetricsRangeSelectorManagerService } from '../../services/metrics-range-selector-manager.service';
import { MetricsRangeSelectorService } from '../../services/metrics-range-selector.service';
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
});
