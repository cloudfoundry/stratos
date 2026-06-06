import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import type { UsagePoint } from '../../../features/applications/app-detail-data.service';

type Metric = 'cpu' | 'mem' | 'disk';

/**
 * Lightweight live-sampled trend chart. Plots ONE metric (cpu | mem | disk)
 * over time with one line per instance, fed by the `usageHistory()` signal
 * from AppDetailDataService.
 *
 * PURE component: it only renders the `history` input. It does not inject the
 * data service or poll — three of these (CPU/Memory/Disk) are wired by the
 * parent, each with its own y-scale. This is independent of the Prometheus
 * metrics-chart (which still backs the Metrics tab).
 */
@Component({
  selector: 'app-instance-usage-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  template: `<canvas baseChart [type]="'line'" [data]="chartData()" [options]="options()"></canvas>`,
})
export class InstanceUsageChartComponent {
  readonly metric = input.required<Metric>();
  readonly history = input.required<ReadonlyMap<number, UsagePoint[]>>();
  readonly unitLabel = input<string>('');

  readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const m = this.metric();
    const datasets = [...this.history().entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([index, points]) => ({
        label: `Instance ${index}`,
        data: points.map(p => p[m]),
        tension: 0.3,
        pointRadius: 0,
      }));
    const maxLen = Math.max(0, ...datasets.map(d => d.data.length));
    // x positions are sample-index, not wall-clock time: assumes instances are
    // sampled in lockstep (they are — one poll feeds all instances). UsagePoint.t
    // is carried for a future time-keyed x-axis but not used here.
    return { labels: Array.from({ length: maxLen }, (_, i) => `${i}`), datasets };
  });

  readonly options = computed<ChartConfiguration<'line'>['options']>(() => {
    const isCpu = this.metric() === 'cpu';
    const unit = this.unitLabel();
    return {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'bottom' } },
      scales: {
        x: { display: false },
        y: {
          beginAtZero: true,
          title: { display: !!unit, text: unit },
          ticks: isCpu
            // CPU is a 0..1 fraction — render the axis as a percentage.
            ? { callback: (value: number | string) => `${Math.round(Number(value) * 100)}%` }
            : undefined,
        },
      },
    };
  });
}
