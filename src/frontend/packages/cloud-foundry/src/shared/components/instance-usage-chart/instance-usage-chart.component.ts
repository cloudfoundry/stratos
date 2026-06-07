import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
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

  // Per-instance legend visibility. Chart.js stores legend toggle state in
  // per-dataset meta, but `chartData()` rebuilds fresh dataset objects on every
  // live poll — wiping that meta and re-showing hidden lines. We track the
  // hidden set here and re-apply it as `dataset.hidden` on every recompute so a
  // user's toggle survives the ~5s refresh.
  private readonly hiddenInstances = signal<ReadonlySet<number>>(new Set());

  readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const m = this.metric();
    const hidden = this.hiddenInstances();
    const datasets = [...this.history().entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([index, points]) => ({
        label: `Instance ${index}`,
        data: points.map(p => p[m]),
        tension: 0.3,
        pointRadius: 0,
        hidden: hidden.has(index),
        // Stash the instance index so the legend onClick can map a chart.js
        // datasetIndex back to our persistent set. chart.js ignores unknown
        // dataset props; the cast keeps the typed dataset shape happy.
        instanceIndex: index,
      } as ChartConfiguration<'line'>['data']['datasets'][number] & { instanceIndex: number }));
    const maxLen = Math.max(0, ...datasets.map(d => d.data.length));
    // x positions are sample-index, not wall-clock time: assumes instances are
    // sampled in lockstep (they are — one poll feeds all instances). UsagePoint.t
    // is carried for a future time-keyed x-axis but not used here.
    return { labels: Array.from({ length: maxLen }, (_, i) => `${i}`), datasets };
  });

  // Immutably flip an instance's hidden state. A new Set instance makes the
  // signal emit so `chartData()` recomputes with the updated visibility.
  private toggleInstanceHidden(index: number): void {
    const next = new Set(this.hiddenInstances());
    next.has(index) ? next.delete(index) : next.add(index);
    this.hiddenInstances.set(next);
  }

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
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          // Custom toggle: persist hidden state in our signal (so it survives
          // the next poll's chartData() rebuild) AND reflect it on the live
          // chart immediately. Default chart.js onClick only touches dataset
          // meta, which we wipe on recompute.
          onClick: (_e, legendItem, legend) => {
            const chart = legend.chart;
            const di = legendItem.datasetIndex ?? 0;
            const inst = (chart.data.datasets[di] as { instanceIndex?: number }).instanceIndex ?? di;
            this.toggleInstanceHidden(inst);
            chart.setDatasetVisibility(di, !chart.isDatasetVisible(di));
            chart.update();
          },
        },
      },
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
