import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ChartConfiguration, Plugin } from 'chart.js';
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
 *
 * Legend visibility is PER-CHART / INDEPENDENT: each chart owns its own hidden
 * set internally. Hiding "Instance 1" on the Memory chart does NOT affect CPU
 * or Disk. A chart.js plugin (`visibilityPlugin`) re-asserts the selection on
 * every update so it survives the ~5s live poll's data swap.
 */
@Component({
  selector: 'app-instance-usage-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  template: `<canvas baseChart [type]="'line'" [data]="chartData()" [options]="options()" [plugins]="plugins"></canvas>`,
})
export class InstanceUsageChartComponent {
  readonly metric = input.required<Metric>();
  readonly history = input.required<ReadonlyMap<number, UsagePoint[]>>();
  readonly unitLabel = input<string>('');

  // Per-instance legend visibility, OWNED INTERNALLY by this chart so each of
  // the CPU/Memory/Disk charts manages its own hidden set independently.
  // Chart.js stores legend toggle state in per-dataset meta and IGNORES
  // `dataset.hidden` on update() after init; a data swap (every ~5s live poll)
  // also resets meta visibility. So the real lever is `visibilityPlugin` below,
  // which re-asserts meta.hidden from this set on every chart update. The legend
  // onClick flips this set via `toggleInstanceHidden`.
  //
  // PUBLIC for read-only access by the parent accordion (used to seed the
  // shared "All metrics" overlay). Still only MUTATED internally via
  // `toggleInstanceHidden` — the parent never writes it.
  readonly hiddenInstances = signal<ReadonlySet<number>>(new Set());

  // Shared "All metrics" overlay, driven by the parent. When non-null this set
  // SHADOWS the internal per-metric set: the chart displays it and legend clicks
  // emit `toggleLinked` (the parent owns the shared set). The internal set is
  // left untouched, so clearing the overlay (back to null) reverts each chart to
  // its own per-metric selection automatically.
  readonly linkedHidden = input<ReadonlySet<number> | null>(null);
  readonly toggleLinked = output<number>();

  /** The set actually shown/enforced: the linked overlay when active, else the
   *  chart's own per-metric set. */
  readonly effectiveHidden = computed<ReadonlySet<number>>(
    () => this.linkedHidden() ?? this.hiddenInstances(),
  );

  /** Flip an instance's hidden state in this chart's internal set. A fresh Set
   *  makes the signal emit so `chartData()` recomputes and the plugin re-runs. */
  private toggleInstanceHidden(index: number): void {
    const next = new Set(this.hiddenInstances());
    next.has(index) ? next.delete(index) : next.add(index);
    this.hiddenInstances.set(next);
  }

  /** Re-assert per-instance legend visibility on every chart update. Chart.js
   *  ignores dataset.hidden after init and a data swap (each live poll) resets
   *  meta visibility, so the user's legend toggle must be re-applied here. */
  private readonly visibilityPlugin: Plugin<'line'> = {
    id: 'enforceInstanceVisibility',
    afterUpdate: (chart) => {
      const hidden = this.effectiveHidden();
      chart.data.datasets.forEach((ds, i) => {
        const inst = (ds as { instanceIndex?: number }).instanceIndex ?? i;
        const meta = chart.getDatasetMeta(i);
        const shouldHide = hidden.has(inst);
        if (!!meta.hidden !== shouldHide) { meta.hidden = shouldHide; }
      });
    },
  };
  readonly plugins: Plugin<'line'>[] = [this.visibilityPlugin];

  readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const m = this.metric();
    const hidden = this.effectiveHidden();
    const datasets = [...this.history().entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([index, points]) => ({
        label: `Instance ${index}`,
        data: points.map(p => p[m]),
        tension: 0.3,
        pointRadius: 0,
        // Inert: chart.js ignores dataset.hidden on update(), so this does NOT
        // hide the line — `visibilityPlugin` is the real lever. We keep it so
        // chartData() depends on hiddenInstances(): a toggle changes [data] →
        // ng2-charts calls update() → the plugin runs immediately (rather than
        // waiting for the next poll). Do not remove the hidden.has() read.
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
          // Custom toggle: flip the instance in this chart's internal hidden
          // set. The set change recomputes `chartData()` (signal-driven +
          // synchronous under zoneless CD), which triggers an ng2-charts
          // update() so `visibilityPlugin` re-asserts meta.hidden. We don't
          // touch chart.js dataset meta directly here.
          onClick: (_e, legendItem, legend) => {
            const chart = legend.chart;
            const di = legendItem.datasetIndex ?? 0;
            const inst = (chart.data.datasets[di] as { instanceIndex?: number }).instanceIndex ?? di;
            // When the shared "All metrics" overlay is active, clicks drive the
            // parent's shared set (applies to all three charts) and leave this
            // chart's own per-metric set untouched. Otherwise toggle locally.
            if (this.linkedHidden() != null) {
              this.toggleLinked.emit(inst);
            } else {
              this.toggleInstanceHidden(inst);
            }
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
