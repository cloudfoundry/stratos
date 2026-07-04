import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { formatBytes } from '../diagnostics-data/entity-footprint';
import { LoadReport, ResourceRow } from '../diagnostics-data/load-performance';

/** Cap the waterfall at the first N resources by start time for readability. */
export const WATERFALL_ROW_CAP = 40;

export interface MilestoneLine {
  label: string;
  title: string;
  ms: number;
}

/** Scale end: whichever finishes last, the load event or the last response end. */
export function waterfallScaleMax(
  loadEventMs: number,
  resources: Pick<ResourceRow, 'startMs' | 'durationMs'>[],
): number {
  const lastEnd = resources.reduce((max, r) => Math.max(max, r.startMs + r.durationMs), 0);
  return Math.max(loadEventMs, lastEnd, 1);
}

/** Map a millisecond offset onto the 0-100 percent range of the scale. */
export function toPercent(ms: number, scaleMaxMs: number): number {
  if (scaleMaxMs <= 0) { return 0; }
  return Math.min(100, Math.max(0, (ms / scaleMaxMs) * 100));
}

/** Width of a start+duration span in percent, clipped to the scale end. */
export function spanPercent(startMs: number, durationMs: number, scaleMaxMs: number): number {
  return toPercent(startMs + durationMs, scaleMaxMs) - toPercent(startMs, scaleMaxMs);
}

/** First N rows by start time. */
export function capRows(resources: ResourceRow[], cap: number = WATERFALL_ROW_CAP): ResourceRow[] {
  return [...resources].sort((a, b) => a.startMs - b.startMs).slice(0, cap);
}

/** Milestone lines to draw; null milestones are skipped. */
export function milestoneLines(report: {
  domContentLoadedMs: number | null;
  loadEventMs: number | null;
  firstContentfulPaintMs: number | null;
  lcpMs: number | null;
}): MilestoneLine[] {
  const candidates: [string, string, number | null][] = [
    ['DCL', 'DOM content loaded', report.domContentLoadedMs],
    ['Load', 'Load event (all initial resources done)', report.loadEventMs],
    ['FCP', 'First contentful paint', report.firstContentfulPaintMs],
    ['LCP', 'Largest contentful paint', report.lcpMs],
  ];
  return candidates
    .filter((c): c is [string, string, number] => c[2] !== null)
    .map(([label, title, ms]) => ({ label, title, ms }));
}

/** 4-10 evenly spaced round-number ticks (1/2/2.5/5 x 10^k steps) up to the scale end. */
export function axisTicks(scaleMaxMs: number): number[] {
  if (scaleMaxMs <= 0) { return []; }
  const pow = Math.pow(10, Math.floor(Math.log10(scaleMaxMs / 4)));
  let step = 10 * pow;
  for (const m of [1, 2, 2.5, 5]) {
    if (Math.floor(scaleMaxMs / (m * pow)) <= 10) {
      step = m * pow;
      break;
    }
  }
  const ticks: number[] = [];
  for (let t = step; t <= scaleMaxMs; t += step) {
    ticks.push(t);
  }
  return ticks;
}

/** Tick label: ms below one second, seconds (trimmed) above. */
export function formatTick(ms: number): string {
  if (ms < 1000) { return `${Math.round(ms)} ms`; }
  const s = ms / 1000;
  return `${Number.isInteger(s) ? s : s.toFixed(1)} s`;
}

/** Last path segment, ignoring a trailing slash; the path itself when empty. */
export function basename(path: string): string {
  const segment = path.split('/').filter(Boolean).pop();
  return segment ?? path;
}

@Component({
  selector: 'app-resource-waterfall',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (rows().length < report().requestCount) {
      <div class="pb-1 text-xs text-content-muted">
        Showing {{ rows().length }} of {{ report().requestCount }} resources
      </div>
    }
    <div class="relative">
      <!-- Milestone lines span the header, rows and axis; offset past the label column. -->
      <div class="absolute inset-y-0 left-56 right-0 pointer-events-none" aria-hidden="true">
        @for (m of milestones(); track m.label) {
          <div
            class="absolute inset-y-0 w-0 border-l border-dashed border-content-muted opacity-60"
            [style.left.%]="toPercent(m.ms, scaleMax())"></div>
        }
      </div>

      <!-- Top axis -->
      <div class="flex h-5">
        <div class="w-56 shrink-0"></div>
        <div class="relative flex-1 min-w-0 border-b border-content-border">
          @for (t of ticks(); track t) {
            <span
              class="absolute bottom-1 -translate-x-1/2 text-[10px] leading-none text-content-muted whitespace-nowrap"
              [style.left.%]="toPercent(t, scaleMax())">{{ formatTick(t) }}</span>
          }
        </div>
      </div>

      <!-- Milestone labels -->
      <div class="flex h-6">
        <div class="w-56 shrink-0"></div>
        <div class="relative flex-1 min-w-0">
          @for (m of milestones(); track m.label) {
            <span
              class="absolute top-0.5 pl-1 text-[10px] leading-none text-content-muted whitespace-nowrap cursor-help"
              [title]="m.title + ' — ' + formatTick(m.ms)"
              [style.left.%]="toPercent(m.ms, scaleMax())">{{ m.label }}</span>
          }
        </div>
      </div>

      <!-- One row per resource -->
      @for (r of rows(); track r.path + r.startMs) {
        <div class="flex h-5 items-stretch hover:bg-content-secondary transition-colors" [title]="barTitle(r)">
          <div class="w-56 shrink-0 pr-2 text-xs leading-5 text-content-muted truncate">{{ basename(r.path) }}</div>
          <div class="relative flex-1 min-w-0">
            <div
              class="absolute top-1/2 -translate-y-1/2 h-2.5 rounded bg-[#2a78d6] dark:bg-[#3987e5]"
              style="min-width: 2px"
              [style.left.%]="toPercent(r.startMs, scaleMax())"
              [style.width.%]="spanPercent(r.startMs, r.durationMs, scaleMax())"></div>
          </div>
        </div>
      }

      <!-- Bottom axis -->
      <div class="flex h-5">
        <div class="w-56 shrink-0"></div>
        <div class="relative flex-1 min-w-0 border-t border-content-border">
          @for (t of ticks(); track t) {
            <span
              class="absolute top-1 -translate-x-1/2 text-[10px] leading-none text-content-muted whitespace-nowrap"
              [style.left.%]="toPercent(t, scaleMax())">{{ formatTick(t) }}</span>
          }
        </div>
      </div>
    </div>
    <div class="pt-2 text-[11px] text-content-muted">
      Dashed lines mark page milestones: DCL = DOM content loaded, Load = load event,
      FCP = first contentful paint, LCP = largest contentful paint (hover a label for its time).
    </div>
  `,
})
export class ResourceWaterfallComponent {
  report = input.required<LoadReport>();

  rows = computed(() => capRows(this.report().resources));
  scaleMax = computed(() => waterfallScaleMax(this.report().loadEventMs, this.report().resources));
  milestones = computed(() => milestoneLines(this.report()));
  ticks = computed(() => axisTicks(this.scaleMax()));

  toPercent = toPercent;
  spanPercent = spanPercent;
  formatTick = formatTick;
  basename = basename;

  barTitle(r: ResourceRow): string {
    return [
      r.path,
      `start: ${r.startMs.toFixed(0)} ms`,
      `duration: ${r.durationMs.toFixed(0)} ms`,
      `transfer: ${formatBytes(r.transferBytes)}`,
      `cached: ${r.cached ? 'yes' : 'no'}`,
    ].join('\n');
  }
}
