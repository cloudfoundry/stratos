import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';

import { formatBytes } from '../diagnostics-data/entity-footprint';
import { LoadReport, ResourceRow } from '../diagnostics-data/load-performance';

/** Group lines per waterfall page. */
export const WATERFALL_ROW_CAP = 40;

/**
 * Resources whose start times fall within this window of a group's first
 * member collapse into one expandable line. Parallel fetch bursts (lazy
 * chunks, fonts, API fan-outs) start within a few ms of each other; widen
 * this if real loads still produce more group lines than pages can hold.
 */
export const WATERFALL_GROUP_GAP_MS = 25;

/** A start-time cluster of resources rendered as one expandable line. */
export interface WaterfallGroup {
  key: string;
  startMs: number;
  endMs: number;
  totalTransferBytes: number;
  rows: ResourceRow[];
}

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

/** Greedy start-time clustering over rows sorted by start: a resource joins
 *  the current group while its start is within gapMs of the group's anchor. */
export function groupRows(resources: ResourceRow[], gapMs: number = WATERFALL_GROUP_GAP_MS): WaterfallGroup[] {
  const sorted = [...resources].sort((a, b) => a.startMs - b.startMs);
  const groups: WaterfallGroup[] = [];
  for (const r of sorted) {
    const current = groups[groups.length - 1];
    if (current && r.startMs - current.startMs <= gapMs) {
      current.rows.push(r);
      current.endMs = Math.max(current.endMs, r.startMs + r.durationMs);
      current.totalTransferBytes += r.transferBytes;
    } else {
      groups.push({
        key: `${r.startMs}:${r.path}`,
        startMs: r.startMs,
        endMs: r.startMs + r.durationMs,
        totalTransferBytes: r.transferBytes,
        rows: [r],
      });
    }
  }
  return groups;
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
    <div class="flex items-center gap-3 pb-1 text-xs text-content-muted">
      <span data-test="waterfall-summary">
        Showing {{ pagedResourceCount() }} of {{ report().requestCount }} resources
        in {{ pagedGroups().length }} of {{ groups().length }} groups
      </span>
      @if (pageCount() > 1) {
        <button
          type="button" data-test="waterfall-prev"
          class="px-1.5 py-0.5 rounded border border-content-border hover:bg-content-secondary disabled:opacity-40 disabled:hover:bg-transparent"
          [disabled]="safePage() === 0" (click)="prevPage()">Prev</button>
        <span>page {{ safePage() + 1 }} / {{ pageCount() }}</span>
        <button
          type="button" data-test="waterfall-next"
          class="px-1.5 py-0.5 rounded border border-content-border hover:bg-content-secondary disabled:opacity-40 disabled:hover:bg-transparent"
          [disabled]="safePage() === pageCount() - 1" (click)="nextPage()">Next</button>
      }
    </div>
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

      <!-- One line per group: single-member groups render as plain resource
           rows; multi-member groups render a summary line that expands. -->
      @for (g of pagedGroups(); track g.key) {
        @if (g.rows.length === 1) {
          <div class="flex h-5 items-stretch hover:bg-content-secondary transition-colors" [title]="barTitle(g.rows[0])">
            <div class="w-56 shrink-0 pr-2 text-xs leading-5 text-content-muted truncate">{{ basename(g.rows[0].path) }}</div>
            <div class="relative flex-1 min-w-0">
              <div
                class="absolute top-1/2 -translate-y-1/2 h-2.5 rounded bg-[#2a78d6] dark:bg-[#3987e5]"
                style="min-width: 2px"
                [style.left.%]="toPercent(g.rows[0].startMs, scaleMax())"
                [style.width.%]="spanPercent(g.rows[0].startMs, g.rows[0].durationMs, scaleMax())"></div>
            </div>
          </div>
        } @else {
          <button
            type="button" data-test="waterfall-group"
            class="flex h-5 w-full items-stretch text-left hover:bg-content-secondary transition-colors cursor-pointer"
            [title]="groupTitle(g)" (click)="toggle(g.key)">
            <span class="w-56 shrink-0 pr-2 text-xs leading-5 text-content-muted truncate">
              <span class="inline-block w-3" aria-hidden="true">{{ expanded().has(g.key) ? '▾' : '▸' }}</span>
              {{ g.rows.length }} resources · {{ basename(g.rows[0].path) }}
            </span>
            <span class="relative flex-1 min-w-0">
              <span
                class="absolute top-1/2 -translate-y-1/2 h-2.5 rounded bg-[#2a78d6] dark:bg-[#3987e5] opacity-70"
                style="min-width: 2px"
                [style.left.%]="toPercent(g.startMs, scaleMax())"
                [style.width.%]="spanPercent(g.startMs, g.endMs - g.startMs, scaleMax())"></span>
            </span>
          </button>
          @if (expanded().has(g.key)) {
            @for (r of g.rows; track r.path + r.startMs) {
              <div class="flex h-5 items-stretch hover:bg-content-secondary transition-colors" [title]="barTitle(r)">
                <div class="w-56 shrink-0 pl-3 pr-2 text-xs leading-5 text-content-muted truncate">{{ basename(r.path) }}</div>
                <div class="relative flex-1 min-w-0">
                  <div
                    class="absolute top-1/2 -translate-y-1/2 h-2.5 rounded bg-[#2a78d6] dark:bg-[#3987e5]"
                    style="min-width: 2px"
                    [style.left.%]="toPercent(r.startMs, scaleMax())"
                    [style.width.%]="spanPercent(r.startMs, r.durationMs, scaleMax())"></div>
                </div>
              </div>
            }
          }
        }
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

  groups = computed(() => groupRows(this.report().resources));
  page = signal(0);
  pageCount = computed(() => Math.max(1, Math.ceil(this.groups().length / WATERFALL_ROW_CAP)));
  safePage = computed(() => Math.min(this.page(), this.pageCount() - 1));
  pagedGroups = computed(() =>
    this.groups().slice(this.safePage() * WATERFALL_ROW_CAP, (this.safePage() + 1) * WATERFALL_ROW_CAP));
  pagedResourceCount = computed(() => this.pagedGroups().reduce((n, g) => n + g.rows.length, 0));
  expanded = signal<ReadonlySet<string>>(new Set());

  scaleMax = computed(() => waterfallScaleMax(this.report().loadEventMs, this.report().resources));
  milestones = computed(() => milestoneLines(this.report()));
  ticks = computed(() => axisTicks(this.scaleMax()));

  toPercent = toPercent;
  spanPercent = spanPercent;
  formatTick = formatTick;
  basename = basename;

  constructor() {
    // A fresh report (Measure again) restarts on the first page, all collapsed.
    effect(() => {
      this.report();
      this.page.set(0);
      this.expanded.set(new Set());
    });
  }

  prevPage(): void {
    this.page.set(Math.max(0, this.safePage() - 1));
  }

  nextPage(): void {
    this.page.set(Math.min(this.pageCount() - 1, this.safePage() + 1));
  }

  toggle(key: string): void {
    const next = new Set(this.expanded());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.expanded.set(next);
  }

  barTitle(r: ResourceRow): string {
    return [
      r.path,
      `start: ${r.startMs.toFixed(0)} ms`,
      `duration: ${r.durationMs.toFixed(0)} ms`,
      `transfer: ${formatBytes(r.transferBytes)}`,
      `cached: ${r.cached ? 'yes' : 'no'}`,
    ].join('\n');
  }

  groupTitle(g: WaterfallGroup): string {
    return [
      `${g.rows.length} resources starting within ${WATERFALL_GROUP_GAP_MS} ms`,
      `start: ${g.startMs.toFixed(0)} ms`,
      `span: ${(g.endMs - g.startMs).toFixed(0)} ms`,
      `transfer: ${formatBytes(g.totalTransferBytes)}`,
      'click to expand',
    ].join('\n');
  }
}
