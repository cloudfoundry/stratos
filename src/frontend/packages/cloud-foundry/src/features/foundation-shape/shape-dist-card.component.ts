import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { Distribution } from './shape-stats';

interface HistRow {
  label: string;
  count: number;
}

/**
 * One shape dimension: its histogram as horizontal bars (value → count, the
 * form that survives bimodal data where min/mean/max misleads) with the full
 * percentile row beneath. Bar idiom follows the load-performance bytes-bar:
 * thin single-hue marks, labels in text tokens, width scaled to the largest
 * bar and capped so value labels fit beside it.
 */
@Component({
  selector: 'app-shape-dist-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="flex flex-col gap-1">
      <div class="text-xs font-semibold uppercase tracking-wider text-content-muted">{{ label() }}</div>
      @for (row of rows(); track row.label) {
        <div class="flex h-4 items-center" [title]="label() + ' = ' + row.label + ': ' + row.count">
          <div class="w-16 shrink-0 pr-2 text-right text-xs text-content-muted tabular-nums truncate">{{ row.label }}</div>
          <div class="flex-1 min-w-0 flex items-center gap-2">
            <!-- Same two-tone vocabulary as the share bars: slate = the empty
                 (zero-valued) share, blue = the data-holding population -->
            <div class="h-2.5 shrink-0 min-w-[2px] rounded"
              [class]="row.label === '0' ? 'bg-[#94a3b8] dark:bg-[#64748b]' : 'bg-[#2a78d6] dark:bg-[#3987e5]'"
              [style.width.%]="width(row)"></div>
            <span class="text-xs tabular-nums">{{ row.count | number }}</span>
          </div>
        </div>
      }
      <div class="mt-1 text-xs text-content-muted">
        min {{ d().min | number }} · median {{ d().median | number }} · p90 {{ d().p90 | number }} ·
        p99 {{ d().p99 | number }} · max {{ d().max | number }} · mean {{ d().mean | number }} ·
        zeros {{ d().zeros | number }} · n {{ d().n | number }}
      </div>
    </div>
  `,
})
export class ShapeDistCardComponent {
  label = input.required<string>();
  d = input.required<Distribution>();

  readonly rows = computed<HistRow[]>(() =>
    Object.entries(this.d().hist).map(([label, count]) => ({ label, count }))
  );

  private readonly maxCount = computed(() => Math.max(1, ...this.rows().map(r => r.count)));

  /** Scaled to 70% of the track so the count labels fit beside the longest bar. */
  width(row: HistRow): number {
    return (row.count / this.maxCount()) * 70;
  }
}
