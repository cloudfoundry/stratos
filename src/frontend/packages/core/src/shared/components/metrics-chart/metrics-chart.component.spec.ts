import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { MetricsDataService } from '@stratosui/store';
import { describe, it, expect } from 'vitest';

import { MetricsChartComponent } from './metrics-chart.component';

// The chart reads its data through MetricsDataService.observe(), so a
// stubbed observation drives it (the V2 metrics actions an earlier,
// skipped suite waited for were deleted in 2847befc2b).
describe('MetricsChartComponent load failure', () => {
  it('shows why the metrics failed to load instead of an empty chart', async () => {
    const error = signal<string | null>('Error proxing request: dial tcp: i/o timeout (500)');
    const observation = {
      metrics: signal(null).asReadonly(), fetching: signal(false).asReadonly(), error: error.asReadonly(),
      refresh: async () => undefined, stop: () => undefined,
    };
    TestBed.configureTestingModule({
      imports: [MetricsChartComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MetricsDataService, useValue: { observe: () => observation } },
      ],
    });
    const fixture = TestBed.createComponent(MetricsChartComponent);
    fixture.componentInstance.metricsConfig = { request: {} as any, getSeriesName: () => '' };
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-test="metrics-chart-error"]')?.textContent)
      .toContain('Failed to load metrics: Error proxing request: dial tcp: i/o timeout (500)');

    error.set(null);
    await fixture.whenStable();
    expect(el.querySelector('[data-test="metrics-chart-error"]')).toBeNull();
  });
});
