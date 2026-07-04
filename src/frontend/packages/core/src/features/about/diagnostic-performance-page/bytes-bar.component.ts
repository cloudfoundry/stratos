import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { formatBytes } from '../diagnostics-data/entity-footprint';
import { ResourceRow } from '../diagnostics-data/load-performance';
import { basename } from './resource-waterfall.component';

/** Show the top N resources by transfer size. */
export const BYTES_BAR_COUNT = 10;

/** Top N rows by transfer size, largest first. */
export function topByTransfer(rows: ResourceRow[], count: number = BYTES_BAR_COUNT): ResourceRow[] {
  return [...rows].sort((a, b) => b.transferBytes - a.transferBytes).slice(0, count);
}

/** Percentage share of the total transfer; 0 when there is no total. */
export function shareOfTotal(bytes: number, totalBytes: number): number {
  return totalBytes <= 0 ? 0 : (bytes / totalBytes) * 100;
}

/** Bar length in percent, linear against the largest bar. */
export function barWidthPercent(bytes: number, maxBytes: number): number {
  return maxBytes <= 0 ? 0 : (bytes / maxBytes) * 100;
}

@Component({
  selector: 'app-bytes-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1">
      @for (r of top(); track r.path + r.startMs) {
        <div class="flex h-5 items-center hover:bg-content-secondary transition-colors" [title]="r.path">
          <div class="w-56 shrink-0 pr-2 text-xs text-content-muted truncate">{{ basename(r.path) }}</div>
          <div class="flex-1 min-w-0 flex items-center gap-2">
            <div
              class="h-3 shrink-0"
              style="min-width: 2px"
              [class]="r.cached
                ? 'rounded bg-transparent border-[1.5px] border-solid border-[#2a78d6] dark:border-[#3987e5]'
                : 'rounded bg-[#2a78d6] dark:bg-[#3987e5]'"
              [style.width.%]="width(r)"></div>
            <span class="text-xs whitespace-nowrap">{{ formatBytes(r.transferBytes) }}@if (r.cached) { (cached)}</span>
            <span class="text-xs text-content-muted whitespace-nowrap">{{ share(r) }}</span>
          </div>
        </div>
      }
    </div>
  `,
})
export class BytesBarComponent {
  resources = input.required<ResourceRow[]>();

  top = computed(() => topByTransfer(this.resources()));
  totalBytes = computed(() => this.resources().reduce((sum, r) => sum + r.transferBytes, 0));
  maxBytes = computed(() => this.top()[0]?.transferBytes ?? 0);

  basename = basename;
  formatBytes = formatBytes;

  /** Scaled to 70% of the track so the value labels fit beside the longest bar. */
  width(r: ResourceRow): number {
    return barWidthPercent(r.transferBytes, this.maxBytes()) * 0.7;
  }

  share(r: ResourceRow): string {
    const pct = shareOfTotal(r.transferBytes, this.totalBytes());
    return pct > 0 && pct < 1 ? '<1%' : `${Math.round(pct)}%`;
  }
}
