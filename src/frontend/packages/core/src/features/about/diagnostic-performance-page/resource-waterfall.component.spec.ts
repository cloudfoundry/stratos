import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { DocumentRow, LoadReport, ResourceRow } from '../diagnostics-data/load-performance';
import {
  ResourceWaterfallComponent,
  shiftDocumentRow,
  WATERFALL_GROUP_GAP_MS,
  WATERFALL_ROW_CAP,
  axisTicks,
  basename,
  formatTick,
  groupRows,
  initialLoadResources,
  mergeMilestoneLabels,
  milestoneLines,
  spanPercent,
  rowLabel,
  toPercent,
  waterfallScaleMax,
  windowPercent,
  windowTicks,
} from './resource-waterfall.component';

const row = (over: Partial<ResourceRow> = {}): ResourceRow => ({
  path: '/main.js',
  startMs: 0,
  durationMs: 10,
  transferBytes: 100,
  decodedBytes: 200,
  protocol: 'h2',
  cached: false,
  ...over,
});

describe('waterfallScaleMax', () => {
  it('uses the load event when it is past the last response end', () => {
    expect(waterfallScaleMax(500, [row({ startMs: 10, durationMs: 20 })])).toBe(500);
  });

  it('uses the last response end when a resource outlives the load event', () => {
    expect(waterfallScaleMax(500, [row({ startMs: 480, durationMs: 100 })])).toBe(580);
  });

  it('never returns zero, so percent math stays finite', () => {
    expect(waterfallScaleMax(0, [])).toBeGreaterThan(0);
  });

  it('extends past the load event to cover a late milestone like LCP', () => {
    const milestones = [{ label: 'LCP', title: 'Largest contentful paint', ms: 248 }];
    expect(waterfallScaleMax(167, [row({ startMs: 180, durationMs: 20 })], milestones)).toBe(248);
  });
});

describe('mergeMilestoneLabels', () => {
  const line = (label: string, ms: number) => ({ label, title: `${label} long name`, ms });

  it('merges labels that would overprint into one line', () => {
    const merged = mergeMilestoneLabels([line('FCP', 240), line('LCP', 243)], 250);
    expect(merged.length).toBe(1);
    expect(merged[0].label).toBe('FCP · LCP');
    expect(merged[0].title).toBe('FCP long name — 240 ms\nLCP long name — 243 ms');
  });

  it('keeps well-separated labels apart, with the time folded into the title', () => {
    const merged = mergeMilestoneLabels([line('DCL', 100), line('Load', 500)], 1000);
    expect(merged.map(m => m.label)).toEqual(['DCL', 'Load']);
    expect(merged[0].title).toBe('DCL long name — 100 ms');
  });

  it('chains a cluster of close labels into a single merged line', () => {
    const merged = mergeMilestoneLabels([line('DCL', 100), line('FCP', 101), line('LCP', 102)], 1000);
    expect(merged.length).toBe(1);
    expect(merged[0].label).toBe('DCL · FCP · LCP');
  });

  it('does not mutate its input', () => {
    const input = [line('FCP', 240), line('LCP', 248)];
    mergeMilestoneLabels(input, 250);
    expect(input[0].label).toBe('FCP');
    expect(input[0].title).toBe('FCP long name');
  });
});

describe('toPercent', () => {
  it('maps ms linearly onto 0-100', () => {
    expect(toPercent(250, 1000)).toBe(25);
  });

  it('clamps to the 0-100 range', () => {
    expect(toPercent(1500, 1000)).toBe(100);
    expect(toPercent(-5, 1000)).toBe(0);
  });

  it('returns 0 for a non-positive scale', () => {
    expect(toPercent(50, 0)).toBe(0);
  });
});

describe('spanPercent', () => {
  it('is the width between start and end percent', () => {
    expect(spanPercent(100, 200, 1000)).toBe(20);
  });

  it('clips a span running past the scale end', () => {
    expect(spanPercent(900, 500, 1000)).toBe(10);
  });
});

describe('groupRows', () => {
  it('returns no groups for no resources', () => {
    expect(groupRows([])).toEqual([]);
  });

  it('clusters resources starting within the gap of the group anchor', () => {
    const groups = groupRows([row({ startMs: 0 }), row({ startMs: 10 }), row({ startMs: 20 })], 25);
    expect(groups.length).toBe(1);
    expect(groups[0].rows.length).toBe(3);
  });

  it('starts a new group past the gap boundary, keeping the boundary inclusive', () => {
    const groups = groupRows([row({ startMs: 0 }), row({ startMs: 25 }), row({ startMs: 26 })], 25);
    expect(groups.map(g => g.rows.length)).toEqual([2, 1]);
    expect(groups[1].startMs).toBe(26);
  });

  it('measures the gap from the group anchor, not the previous member', () => {
    // 0, 20, 40: 40 is within 25ms of 20 but not of the anchor 0.
    const groups = groupRows([row({ startMs: 0 }), row({ startMs: 20 }), row({ startMs: 40 })], 25);
    expect(groups.map(g => g.rows.length)).toEqual([2, 1]);
  });

  it('orders groups by start time regardless of input order', () => {
    const groups = groupRows([row({ startMs: 100 }), row({ startMs: 0 })], 25);
    expect(groups.map(g => g.startMs)).toEqual([0, 100]);
  });

  it('aggregates span end and transfer bytes over members', () => {
    const groups = groupRows([
      row({ startMs: 0, durationMs: 50, transferBytes: 100 }),
      row({ startMs: 10, durationMs: 10, transferBytes: 200 }),
    ], 25);
    expect(groups[0].endMs).toBe(50);
    expect(groups[0].totalTransferBytes).toBe(300);
  });

  it('does not mutate its input', () => {
    const input = [row({ startMs: 2 }), row({ startMs: 1 })];
    groupRows(input);
    expect(input[0].startMs).toBe(2);
  });

  it('uses the exported gap by default', () => {
    const groups = groupRows([row({ startMs: 0 }), row({ startMs: WATERFALL_GROUP_GAP_MS })]);
    expect(groups.length).toBe(1);
  });
});

describe('rowLabel', () => {
  it('keeps a file basename bare', () => {
    expect(rowLabel('/assets/js/main.abc123.js')).toBe('main.abc123.js');
  });

  it('prefixes an extensionless basename with its parent segment', () => {
    expect(rowLabel('/@vite/client')).toBe('@vite/client');
    expect(rowLabel('/pp/v1/proxy/apps/df29d654')).toBe('apps/df29d654');
  });

  it('leaves a single extensionless segment bare', () => {
    expect(rowLabel('/info')).toBe('info');
  });
});

describe('windowPercent', () => {
  it('maps ms linearly onto 0-100 within the window', () => {
    expect(windowPercent(1500, { startMs: 1000, endMs: 2000 })).toBe(50);
  });

  it('clamps values outside the window', () => {
    expect(windowPercent(500, { startMs: 1000, endMs: 2000 })).toBe(0);
    expect(windowPercent(2500, { startMs: 1000, endMs: 2000 })).toBe(100);
  });

  it('returns 0 for an empty window', () => {
    expect(windowPercent(1000, { startMs: 1000, endMs: 1000 })).toBe(0);
  });
});

describe('windowTicks', () => {
  it('matches axisTicks for a zero-based window', () => {
    expect(windowTicks({ startMs: 0, endMs: 1000 })).toEqual(axisTicks(1000));
  });

  it('emits round-number ticks inside a shifted window, excluding the start edge', () => {
    expect(windowTicks({ startMs: 1000, endMs: 2000 }))
      .toEqual([1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000]);
  });

  it('returns nothing for an empty window', () => {
    expect(windowTicks({ startMs: 1000, endMs: 1000 })).toEqual([]);
  });
});

describe('initialLoadResources', () => {
  it('drops resources starting after the load event, keeping the boundary inclusive', () => {
    const rows = [row({ startMs: 100 }), row({ startMs: 500 }), row({ startMs: 501 })];
    expect(initialLoadResources(rows, 500).map(r => r.startMs)).toEqual([100, 500]);
  });

  it('filters nothing when the load event is unknown', () => {
    const rows = [row({ startMs: 100 }), row({ startMs: 9999 })];
    expect(initialLoadResources(rows, 0)).toEqual(rows);
  });
});

describe('milestoneLines', () => {
  it('includes DCL, load, FCP and LCP when all are present', () => {
    const lines = milestoneLines({
      domContentLoadedMs: 300, loadEventMs: 500, firstContentfulPaintMs: 250, lcpMs: 400,
    });
    expect(lines.map(l => l.label)).toEqual(['DCL', 'Load', 'FCP', 'LCP']);
    expect(lines.map(l => l.ms)).toEqual([300, 500, 250, 400]);
  });

  it('skips null milestones', () => {
    const lines = milestoneLines({
      domContentLoadedMs: 300, loadEventMs: 500, firstContentfulPaintMs: null, lcpMs: null,
    });
    expect(lines.map(l => l.label)).toEqual(['DCL', 'Load']);
  });
});

describe('axisTicks', () => {
  it('returns between 4 and 10 ticks for typical scales', () => {
    for (const max of [100, 530, 1000, 3210, 12000, 90000]) {
      const ticks = axisTicks(max);
      expect(ticks.length).toBeGreaterThanOrEqual(4);
      expect(ticks.length).toBeLessThanOrEqual(10);
      expect(ticks.every(t => t > 0 && t <= max)).toBe(true);
    }
  });

  it('uses 100ms steps at a ~600ms scale and 50ms steps at ~300ms', () => {
    expect(axisTicks(600)).toEqual([100, 200, 300, 400, 500, 600]);
    expect(axisTicks(300)).toEqual([50, 100, 150, 200, 250, 300]);
  });

  it('returns evenly spaced round steps', () => {
    expect(axisTicks(1000)).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
  });

  it('returns no ticks for a non-positive scale', () => {
    expect(axisTicks(0)).toEqual([]);
  });
});

describe('formatTick', () => {
  it('formats sub-second ticks in ms', () => {
    expect(formatTick(200)).toBe('200 ms');
  });

  it('formats second-scale ticks in s, trimming trailing zeros', () => {
    expect(formatTick(2000)).toBe('2 s');
    expect(formatTick(2500)).toBe('2.5 s');
  });
});

describe('basename', () => {
  it('returns the last path segment', () => {
    expect(basename('/dist/assets/main-abc123.js')).toBe('main-abc123.js');
  });

  it('ignores a trailing slash', () => {
    expect(basename('/api/v1/')).toBe('v1');
  });

  it('falls back to the path itself when there is no segment', () => {
    expect(basename('/')).toBe('/');
  });
});

const reportWith = (resources: ResourceRow[]): LoadReport => ({
  collectedAt: '2026-07-04T00:00:00.000Z',
  topology: 'local/other',
  requestId: null,
  protocol: 'h2',
  requestStartMs: 10,
  responseStartMs: 12,
  domContentLoadedMs: 300,
  loadEventMs: 500,
  firstContentfulPaintMs: 250,
  lcpMs: null,
  lcpElement: null,
  requestCount: resources.length,
  totalTransferBytes: resources.reduce((n, r) => n + r.transferBytes, 0),
  initialRequestCount: resources.length,
  initialTransferBytes: resources.reduce((n, r) => n + r.transferBytes, 0),
  sinceLoadRequestCount: 0,
  sinceLoadTransferBytes: 0,
  phases: null,
  document: null,
  resources,
});

const doc = (over: Partial<DocumentRow> = {}): DocumentRow => ({
  path: '/',
  startMs: 0,
  endMs: 860,
  transferBytes: 5000,
  segments: [
    { label: 'stalled', startMs: 0, durationMs: 320 },
    { label: 'TLS', startMs: 320, durationMs: 224 },
    { label: 'server wait', startMs: 544, durationMs: 212 },
    { label: 'download', startMs: 756, durationMs: 104 },
  ],
  ...over,
});

describe('shiftDocumentRow', () => {
  it('drops segments that end before the offset and clips one that straddles it', () => {
    const shifted = shiftDocumentRow(doc(), 400)!;
    expect(shifted.startMs).toBe(0);
    expect(shifted.endMs).toBe(460);
    expect(shifted.segments).toEqual([
      { label: 'TLS', startMs: 0, durationMs: 144 },
      { label: 'server wait', startMs: 144, durationMs: 212 },
      { label: 'download', startMs: 356, durationMs: 104 },
    ]);
  });

  it('returns the row unchanged at zero offset', () => {
    expect(shiftDocumentRow(doc(), 0)).toEqual(doc());
  });

  it('passes null through', () => {
    expect(shiftDocumentRow(null, 100)).toBeNull();
  });
});

/** One resource per group: starts spaced past the gap so nothing clusters. */
const spacedResources = (count: number): ResourceRow[] =>
  Array.from({ length: count }, (_, i) =>
    row({ path: `/chunk-${i}.js`, startMs: i * (WATERFALL_GROUP_GAP_MS + 1) * 2 }));

describe('ResourceWaterfallComponent', () => {
  let fixture: ComponentFixture<ResourceWaterfallComponent>;

  const render = (report: LoadReport) => {
    fixture.componentRef.setInput('report', report);
    fixture.detectChanges();
  };
  const el = () => fixture.nativeElement as HTMLElement;
  const query = <T extends HTMLElement>(selector: string) => el().querySelector<T>(selector);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceWaterfallComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(ResourceWaterfallComponent);
  });

  it('renders the document request as a pinned segmented row', () => {
    render({ ...reportWith(spacedResources(2)), document: doc() });
    const documentEl = query('[data-test="waterfall-document"]');
    expect(documentEl).not.toBeNull();
    expect(documentEl!.textContent).toContain('document');
    expect(documentEl!.querySelectorAll('[data-test="waterfall-document-segment"]').length).toBe(4);
  });

  it('omits the document row when the report has none', () => {
    render(reportWith(spacedResources(2)));
    expect(query('[data-test="waterfall-document"]')).toBeNull();
  });

  it('extends the scale to cover a document outliving every resource', () => {
    render({ ...reportWith([row({ startMs: 0, durationMs: 10 })]), loadEventMs: 100, document: doc({ endMs: 2000 }) });
    expect(fixture.componentInstance.scaleMax()).toBeGreaterThanOrEqual(2000);
  });

  it('summarises resources and groups in the banner', () => {
    render(reportWith(spacedResources(3)));
    expect(query('[data-test="waterfall-summary"]')?.textContent)
      .toMatch(/Showing 3 of 3 resources\s+in 3 of 3 groups/);
  });

  it('hides paging controls when the groups fit one page', () => {
    render(reportWith(spacedResources(3)));
    expect(query('[data-test="waterfall-next"]')).toBeNull();
  });

  it('pages group lines past the row cap', () => {
    render(reportWith(spacedResources(WATERFALL_ROW_CAP + 5)));
    const prev = query<HTMLButtonElement>('[data-test="waterfall-prev"]');
    const next = query<HTMLButtonElement>('[data-test="waterfall-next"]');
    expect(prev?.disabled).toBe(true);
    expect(el().textContent).toContain(`Showing ${WATERFALL_ROW_CAP} of ${WATERFALL_ROW_CAP + 5} resources`);

    next?.click();
    fixture.detectChanges();
    expect(el().textContent).toContain(`Showing 5 of ${WATERFALL_ROW_CAP + 5} resources`);
    expect(query<HTMLButtonElement>('[data-test="waterfall-next"]')?.disabled).toBe(true);
    expect(query<HTMLButtonElement>('[data-test="waterfall-prev"]')?.disabled).toBe(false);
  });

  it('collapses a start-time burst into one line and expands it on click', () => {
    render(reportWith([
      row({ path: '/a.js', startMs: 0 }),
      row({ path: '/b.js', startMs: 5 }),
      row({ path: '/late.js', startMs: 500 }),
    ]));
    expect(el().textContent).toContain('2 resources');
    expect(el().textContent).not.toContain('b.js');

    query<HTMLButtonElement>('[data-test="waterfall-group"]')?.click();
    fixture.detectChanges();
    expect(el().textContent).toContain('a.js');
    expect(el().textContent).toContain('b.js');

    query<HTMLButtonElement>('[data-test="waterfall-group"]')?.click();
    fixture.detectChanges();
    expect(el().textContent).not.toContain('b.js');
  });

  it('shifts resources and milestones to the Stratos clock when toggled', () => {
    render({
      ...reportWith([row({ path: '/a.js', startMs: 250 })]),
      requestStartMs: 200,
      domContentLoadedMs: 300,
      loadEventMs: 500,
    });
    const toggle = query<HTMLInputElement>('[data-test="waterfall-clock"]');
    expect(toggle).toBeTruthy();
    expect(toggle?.checked).toBe(false);

    toggle?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.groups()[0].startMs).toBe(50);
    expect(fixture.componentInstance.milestones().find(m => m.label === 'DCL')?.ms).toBe(100);
    expect(fixture.componentInstance.milestones().find(m => m.label === 'Load')?.ms).toBe(300);
  });

  it('keeps the initial-load filter aligned with the shifted clock', () => {
    render({
      ...reportWith([row({ path: '/early.js', startMs: 400 }), row({ path: '/late.js', startMs: 501 })]),
      requestStartMs: 200,
      loadEventMs: 500,
    });
    query<HTMLInputElement>('[data-test="waterfall-clock"]')?.click();
    query<HTMLInputElement>('[data-test="waterfall-initial-only"]')?.click();
    fixture.detectChanges();
    const paths = fixture.componentInstance.visibleResources().map(r => r.path);
    expect(paths).toContain('/early.js');
    expect(paths).not.toContain('/late.js');
  });

  it('resets to the first page when a new report arrives', async () => {
    render(reportWith(spacedResources(WATERFALL_ROW_CAP + 5)));
    query<HTMLButtonElement>('[data-test="waterfall-next"]')?.click();
    fixture.detectChanges();
    expect(el().textContent).toContain('page 2 / 2');

    render(reportWith(spacedResources(WATERFALL_ROW_CAP + 5)));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el().textContent).toContain('page 1 / 2');
  });
});
