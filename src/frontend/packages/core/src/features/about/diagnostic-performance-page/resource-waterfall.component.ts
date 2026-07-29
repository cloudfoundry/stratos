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

/** The time range the waterfall currently displays (brush zoom). */
export interface ViewWindow {
  startMs: number;
  endMs: number;
}

/** Map a millisecond offset onto the 0-100 percent range of a view window. */
export function windowPercent(ms: number, w: ViewWindow): number {
  const span = w.endMs - w.startMs;
  if (span <= 0) { return 0; }
  return Math.min(100, Math.max(0, ((ms - w.startMs) / span) * 100));
}

/** Scale end: whichever finishes last — the load event, the last response end,
 *  or the latest milestone (LCP can land after both; clamping it to the edge
 *  overprints its label into unreadable fragments). */
export function waterfallScaleMax(
  loadEventMs: number,
  resources: Pick<ResourceRow, 'startMs' | 'durationMs'>[],
  milestones: MilestoneLine[] = [],
): number {
  const lastEnd = resources.reduce((max, r) => Math.max(max, r.startMs + r.durationMs), 0);
  const lastMilestone = milestones.reduce((max, m) => Math.max(max, m.ms), 0);
  return Math.max(loadEventMs, lastEnd, lastMilestone, 1);
}

/** Merge milestone labels that would overprint (closer than minGapPercent on
 *  the scale) into one combined label, e.g. "FCP · LCP". Titles come back
 *  fully formed, one "name — time" line per merged milestone. */
export function mergeMilestoneLabels(
  lines: MilestoneLine[],
  scaleMaxMs: number,
  minGapPercent = 2,
  startMs = 0,
): MilestoneLine[] {
  const window: ViewWindow = { startMs, endMs: scaleMaxMs };
  const sorted = [...lines].sort((a, b) => a.ms - b.ms);
  const merged: MilestoneLine[] = [];
  for (const line of sorted) {
    const last = merged[merged.length - 1];
    const titled = `${line.title} — ${formatTick(line.ms)}`;
    if (last && windowPercent(line.ms, window) - windowPercent(last.ms, window) < minGapPercent) {
      last.label = `${last.label} · ${line.label}`;
      last.title = `${last.title}\n${titled}`;
    } else {
      merged.push({ ...line, title: titled });
    }
  }
  return merged;
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

/** Resources that started before the load event; everything when the load
 *  event is unknown (0) — a filter that hides all rows helps nobody. */
export function initialLoadResources(resources: ResourceRow[], loadEventMs: number): ResourceRow[] {
  if (loadEventMs <= 0) { return resources; }
  return resources.filter(r => r.startMs <= loadEventMs);
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

/** 4-10 evenly spaced round-number ticks (1/2/2.5/5 x 10^k steps) across a window. */
export function windowTicks(w: ViewWindow): number[] {
  const span = w.endMs - w.startMs;
  if (span <= 0) { return []; }
  const pow = Math.pow(10, Math.floor(Math.log10(span / 4)));
  let step = 10 * pow;
  for (const m of [1, 2, 2.5, 5]) {
    if (Math.floor(span / (m * pow)) <= 10) {
      step = m * pow;
      break;
    }
  }
  const ticks: number[] = [];
  for (let t = Math.ceil(w.startMs / step) * step; t <= w.endMs; t += step) {
    if (t > w.startMs) { ticks.push(t); }
  }
  return ticks;
}

/** windowTicks from zero up to the scale end. */
export function axisTicks(scaleMaxMs: number): number[] {
  return windowTicks({ startMs: 0, endMs: scaleMaxMs });
}

/** Tick label: ms below one second, seconds (trimmed, up to 2 decimals when zoomed) above. */
export function formatTick(ms: number): string {
  if (ms < 1000) { return `${Math.round(ms)} ms`; }
  return `${parseFloat((ms / 1000).toFixed(2))} s`;
}

/** Last path segment, ignoring a trailing slash; the path itself when empty. */
export function basename(path: string): string {
  const segment = path.split('/').filter(Boolean).pop();
  return segment ?? path;
}

/** Row label: the basename, prefixed with its parent segment when the basename
 *  has no extension — bare segments like "client", "component" or a guid say
 *  nothing without the context of where they live. */
export function rowLabel(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const last = segments.pop();
  if (last === undefined) { return path; }
  const parent = segments.pop();
  return last.includes('.') || parent === undefined ? last : `${parent}/${last}`;
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
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox" data-test="waterfall-initial-only"
          [checked]="initialOnly()" (change)="initialOnly.set($any($event.target).checked)">
        Initial load only
      </label>
      @if (viewWindow(); as w) {
        <span data-test="waterfall-zoom-range">{{ formatTick(w.startMs) }} &ndash; {{ formatTick(w.endMs) }}</span>
        <button
          type="button" data-test="waterfall-zoom-reset"
          class="px-1.5 py-0.5 rounded border border-content-border hover:bg-content-secondary"
          (click)="resetZoom()">Reset zoom</button>
      }
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
        @for (m of visibleMilestones(); track m.label) {
          <div
            class="absolute inset-y-0 w-0 border-l border-dashed border-content-muted opacity-60"
            [style.left.%]="pct(m.ms)"></div>
        }
        @if (brushRect(); as b) {
          <div
            class="absolute inset-y-0 bg-[#2a78d6]/15 border-x border-[#2a78d6]/50"
            [style.left.%]="b.left" [style.width.%]="b.width"></div>
        }
      </div>

      <!-- Top axis: also the brush surface — drag along it to zoom. -->
      <div class="flex h-5">
        <div class="w-56 shrink-0"></div>
        <div
          class="relative flex-1 min-w-0 border-b border-content-border cursor-crosshair touch-none"
          data-test="waterfall-brush"
          title="Drag to zoom to a time range; double-click to reset"
          (pointerdown)="onBrushStart($event)"
          (pointermove)="onBrushMove($event)"
          (pointerup)="onBrushEnd()"
          (pointercancel)="brush.set(null)"
          (dblclick)="resetZoom()">
          @for (t of ticks(); track t) {
            <span
              class="absolute bottom-1 -translate-x-1/2 text-[10px] leading-none text-content-muted whitespace-nowrap pointer-events-none"
              [style.left.%]="pct(t)">{{ formatTick(t) }}</span>
          }
        </div>
      </div>

      <!-- Milestone labels (merged where they would overprint) -->
      <div class="flex h-6">
        <div class="w-56 shrink-0"></div>
        <div class="relative flex-1 min-w-0">
          @for (m of labelMilestones(); track m.label) {
            <span
              class="absolute top-0.5 text-[10px] leading-none text-content-muted whitespace-nowrap cursor-help"
              [class.pl-1]="pct(m.ms) <= 90"
              [class.pr-1]="pct(m.ms) > 90"
              [style.transform]="pct(m.ms) > 90 ? 'translateX(-100%)' : null"
              [title]="m.title"
              [style.left.%]="pct(m.ms)">{{ m.label }}</span>
          }
        </div>
      </div>

      <!-- One line per group: single-member groups render as plain resource
           rows; multi-member groups render a summary line that expands. -->
      @for (g of pagedGroups(); track g.key) {
        @if (g.rows.length === 1) {
          <div class="flex h-5 items-stretch hover:bg-content-secondary transition-colors" [title]="barTitle(g.rows[0])">
            <div class="w-56 shrink-0 pr-2 text-xs leading-5 text-content-muted truncate">{{ rowLabel(g.rows[0].path) }}</div>
            <div class="relative flex-1 min-w-0">
              <div
                class="absolute top-1/2 -translate-y-1/2 h-2.5 rounded bg-[#2a78d6] dark:bg-[#3987e5] min-w-[2px]"
                [style.left.%]="pct(g.rows[0].startMs)"
                [style.width.%]="spanPct(g.rows[0].startMs, g.rows[0].durationMs)"></div>
            </div>
          </div>
        } @else {
          <button
            type="button" data-test="waterfall-group"
            class="flex h-5 w-full items-stretch text-left hover:bg-content-secondary transition-colors cursor-pointer"
            [title]="groupTitle(g)" (click)="toggle(g.key)">
            <span class="w-56 shrink-0 pr-2 text-xs leading-5 text-content-muted truncate">
              <span class="inline-block w-3" aria-hidden="true">{{ expanded().has(g.key) ? '▾' : '▸' }}</span>
              {{ g.rows.length }} resources · {{ rowLabel(g.rows[0].path) }}
            </span>
            <span class="relative flex-1 min-w-0">
              <span
                class="absolute top-1/2 -translate-y-1/2 h-2.5 rounded bg-[#2a78d6] dark:bg-[#3987e5] opacity-70 min-w-[2px]"
                [style.left.%]="pct(g.startMs)"
                [style.width.%]="spanPct(g.startMs, g.endMs - g.startMs)"></span>
            </span>
          </button>
          @if (expanded().has(g.key)) {
            @for (r of g.rows; track r.path + r.startMs) {
              <div class="flex h-5 items-stretch hover:bg-content-secondary transition-colors" [title]="barTitle(r)">
                <div class="w-56 shrink-0 pl-3 pr-2 text-xs leading-5 text-content-muted truncate">{{ rowLabel(r.path) }}</div>
                <div class="relative flex-1 min-w-0">
                  <div
                    class="absolute top-1/2 -translate-y-1/2 h-2.5 rounded bg-[#2a78d6] dark:bg-[#3987e5] min-w-[2px]"
                    [style.left.%]="pct(r.startMs)"
                    [style.width.%]="spanPct(r.startMs, r.durationMs)"></div>
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
              [style.left.%]="pct(t)">{{ formatTick(t) }}</span>
          }
        </div>
      </div>
    </div>
    <div class="pt-2 text-[11px] text-content-muted">
      Dashed lines mark page milestones: DCL = DOM content loaded, Load = load event,
      FCP = first contentful paint, LCP = largest contentful paint (hover a label for its time).
      Drag along the top axis to zoom to a time range; drag again to drill deeper,
      double-click the axis (or Reset zoom) to zoom back out.
    </div>
  `,
})
export class ResourceWaterfallComponent {
  report = input.required<LoadReport>();

  /** Hide fetches that started after the load event (lazy route chunks from
   *  post-load navigation) so the scale stays comparable between looks. */
  initialOnly = signal(false);
  visibleResources = computed(() =>
    this.initialOnly() ? initialLoadResources(this.report().resources, this.report().loadEventMs) : this.report().resources);

  groups = computed(() => groupRows(this.visibleResources()));
  milestones = computed(() => milestoneLines(this.report()));
  scaleMax = computed(() => waterfallScaleMax(this.report().loadEventMs, this.visibleResources(), this.milestones()));

  /** Brush zoom: null = full scale. */
  viewWindow = signal<ViewWindow | null>(null);
  view = computed<ViewWindow>(() => this.viewWindow() ?? { startMs: 0, endMs: this.scaleMax() });
  /** In-progress drag selection, in percent of the current view. */
  brush = signal<{ fromPct: number, toPct: number } | null>(null);
  brushRect = computed(() => {
    const b = this.brush();
    if (!b) { return null; }
    return { left: Math.min(b.fromPct, b.toPct), width: Math.abs(b.toPct - b.fromPct) };
  });

  /** Groups intersecting the view window; bars are clipped at the edges. */
  windowGroups = computed(() => {
    const v = this.view();
    return this.groups().filter(g => g.endMs >= v.startMs && g.startMs <= v.endMs);
  });
  page = signal(0);
  pageCount = computed(() => Math.max(1, Math.ceil(this.windowGroups().length / WATERFALL_ROW_CAP)));
  safePage = computed(() => Math.min(this.page(), this.pageCount() - 1));
  pagedGroups = computed(() =>
    this.windowGroups().slice(this.safePage() * WATERFALL_ROW_CAP, (this.safePage() + 1) * WATERFALL_ROW_CAP));
  pagedResourceCount = computed(() => this.pagedGroups().reduce((n, g) => n + g.rows.length, 0));
  expanded = signal<ReadonlySet<string>>(new Set());

  visibleMilestones = computed(() => {
    const v = this.view();
    return this.milestones().filter(m => m.ms >= v.startMs && m.ms <= v.endMs);
  });
  /** Labels merged where they would overprint; the dashed lines still draw per milestone. */
  labelMilestones = computed(() => {
    const v = this.view();
    return mergeMilestoneLabels(this.visibleMilestones(), v.endMs, 2, v.startMs);
  });
  ticks = computed(() => windowTicks(this.view()));

  formatTick = formatTick;
  basename = basename;
  rowLabel = rowLabel;

  constructor() {
    // A fresh report (Measure again) restarts on the first page, all collapsed, unzoomed.
    effect(() => {
      this.report();
      this.page.set(0);
      this.expanded.set(new Set());
      this.viewWindow.set(null);
    });
  }

  pct(ms: number): number {
    return windowPercent(ms, this.view());
  }

  spanPct(startMs: number, durationMs: number): number {
    const v = this.view();
    return windowPercent(startMs + durationMs, v) - windowPercent(startMs, v);
  }

  private brushPct(e: PointerEvent): number {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (rect.width <= 0) { return 0; }
    return Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
  }

  onBrushStart(e: PointerEvent): void {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const pct = this.brushPct(e);
    this.brush.set({ fromPct: pct, toPct: pct });
  }

  onBrushMove(e: PointerEvent): void {
    const b = this.brush();
    if (!b) { return; }
    this.brush.set({ ...b, toPct: this.brushPct(e) });
  }

  onBrushEnd(): void {
    const b = this.brush();
    this.brush.set(null);
    if (!b) { return; }
    const lo = Math.min(b.fromPct, b.toPct);
    const hi = Math.max(b.fromPct, b.toPct);
    if (hi - lo < 1) { return; } // a click, not a drag
    const v = this.view();
    const span = v.endMs - v.startMs;
    this.viewWindow.set({
      startMs: v.startMs + (lo / 100) * span,
      endMs: v.startMs + (hi / 100) * span,
    });
    this.page.set(0);
  }

  resetZoom(): void {
    this.viewWindow.set(null);
    this.brush.set(null);
    this.page.set(0);
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
      g.rows[0].path,
      `${g.rows.length} resources starting within ${WATERFALL_GROUP_GAP_MS} ms`,
      `start: ${g.startMs.toFixed(0)} ms`,
      `span: ${(g.endMs - g.startMs).toFixed(0)} ms`,
      `transfer: ${formatBytes(g.totalTransferBytes)}`,
      'click to expand',
    ].join('\n');
  }
}
