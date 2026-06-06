import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import type { UsagePoint } from '../../../features/applications/app-detail-data.service';

type Metric = 'cpu' | 'mem' | 'disk';

/**
 * Format a byte count as a short, human-readable string (1024-based), with at
 * most one decimal place. Used for the mem/disk y-axis ticks so the chart shows
 * `256 MB` / `1 GB` instead of raw bytes.
 *
 *   formatBytes(0)               -> '0'
 *   formatBytes(512)             -> '512 B'
 *   formatBytes(256*1024*1024)   -> '256 MB'
 *   formatBytes(1024**3)         -> '1 GB'
 *
 * Pure and standalone — no service injection (keeps the chart component pure).
 * Non-finite/NaN and zero collapse to '0'. Negative values are treated by
 * magnitude with a leading '-'.
 */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n === 0) {
    return '0';
  }
  const sign = n < 0 ? '-' : '';
  let value = Math.abs(n);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  // At most one decimal, but drop a trailing `.0` so `256.0 MB` reads `256 MB`.
  let rounded = Math.round(value * 10) / 10;
  // Rounding can push a just-below-boundary value up to 1024 (e.g. 1048575
  // -> 1023.999... -> 1024 KB). Promote to the next unit so it reads `1 MB`.
  while (rounded >= 1024 && unit < units.length - 1) {
    rounded = Math.round((rounded / 1024) * 10) / 10;
    unit++;
  }
  return `${sign}${rounded} ${units[unit]}`;
}

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
    const metric = this.metric();
    const unit = this.unitLabel();
    // CPU is a 0..1 fraction — render the axis as a percentage. Mem/disk are raw
    // bytes — humanize the ticks (256 MB, 1 GB) so the axis is self-describing.
    const callback =
      metric === 'cpu'
        ? (value: number | string) => `${Math.round(Number(value) * 100)}%`
        : (value: number | string) => formatBytes(Number(value));
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
          ticks: { callback },
        },
      },
    };
  });
}
