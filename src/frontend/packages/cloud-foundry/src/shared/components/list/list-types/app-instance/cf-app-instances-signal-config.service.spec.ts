import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { UtilsService } from '@stratosui/core';

import { CfAppInstancesSignalConfigService } from './cf-app-instances-signal-config.service';
import { AppDetailDataService } from '../../../../../features/applications/app-detail-data.service';
import { AppInstanceActionsService } from '../../../../services/app-instance-actions.service';
import type { StAppStat } from '../../../../../services/endpoint-data/stratos-types';

// Minimal StAppStat factory.
function makeStat(overrides: Partial<StAppStat> = {}): StAppStat {
  return {
    index: 0,
    state: 'RUNNING',
    uptime: 100,
    memQuota: 1024,
    diskQuota: 2048,
    fdsQuota: 16384,
    host: '10.0.0.1',
    usage: { time: '2026-05-03T00:00:00Z', cpu: 0.1, mem: 256, disk: 512 },
    ...overrides,
  };
}

// Stub data service: a writable stats() signal + refresh().
function makeDataServiceStub(initial: StAppStat[] = []) {
  const stats = signal<StAppStat[]>(initial);
  return {
    stats,
    refresh: vi.fn(async (_kind?: string) => undefined),
  };
}

// Stub action service exposing the signals + killInstance verb the
// config service reads/calls.
function makeActionsServiceStub() {
  const transitioningIndex = signal<number | null>(null);
  return {
    transitioningIndex,
    inFlight: signal(false),
    killInstance: vi.fn(async (_index: number) => undefined),
  };
}

// Real UtilsService has zero deps relevant to this spec; constructing it
// directly avoids dragging in the full TestBed for the cells we render.
function makeUtils(): UtilsService {
  return new UtilsService();
}

interface Stubs {
  data: ReturnType<typeof makeDataServiceStub>;
  actions: ReturnType<typeof makeActionsServiceStub>;
}

function configure(stubs?: Partial<Stubs> & { initialStats?: StAppStat[] }): {
  svc: CfAppInstancesSignalConfigService;
  data: ReturnType<typeof makeDataServiceStub>;
  actions: ReturnType<typeof makeActionsServiceStub>;
} {
  TestBed.resetTestingModule();
  const data = stubs?.data ?? makeDataServiceStub(stubs?.initialStats ?? []);
  const actions = stubs?.actions ?? makeActionsServiceStub();

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      CfAppInstancesSignalConfigService,
      { provide: AppDetailDataService, useValue: data },
      { provide: AppInstanceActionsService, useValue: actions },
      { provide: UtilsService, useValue: makeUtils() },
    ],
  });
  const svc = TestBed.inject(CfAppInstancesSignalConfigService);
  return { svc, data, actions };
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfAppInstancesSignalConfigService', () => {
  // ---------------------------------------------------------------------------
  // Construction
  // ---------------------------------------------------------------------------

  it('constructs without throwing', () => {
    expect(() => configure()).not.toThrow();
  });

  it('exposes filter, sort, pageSize, pageIndex, nameFilter, viewMode signals', () => {
    const { svc } = configure();
    expect(svc.filter).toBeDefined();
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
    expect(svc.nameFilter).toBeDefined();
    expect(svc.viewMode).toBeDefined();
  });

  it('builds a ViewPipeline driven by stats()', () => {
    const { svc } = configure();
    expect(svc.view).toBeDefined();
    expect(svc.view.pagedItems()).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Source signal flow
  // ---------------------------------------------------------------------------

  it('flows stats() through the source signal: 2 rows in → 2 rows out', () => {
    const data = makeDataServiceStub([
      makeStat({ index: 0 }),
      makeStat({ index: 1 }),
    ]);
    const { svc } = configure({ data });
    expect(svc.stats().length).toBe(2);
    expect(svc.view.totalFilteredResults()).toBe(2);
  });

  it('reactively re-derives view when stats() changes', () => {
    const data = makeDataServiceStub([]);
    const { svc } = configure({ data });
    expect(svc.view.totalFilteredResults()).toBe(0);
    data.stats.set([makeStat({ index: 0 }), makeStat({ index: 1 }), makeStat({ index: 2 })]);
    expect(svc.view.totalFilteredResults()).toBe(3);
  });

  // ---------------------------------------------------------------------------
  // Columns
  // ---------------------------------------------------------------------------

  it('buildColumns returns the expected column set (matches legacy 1:1 + actions)', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const keys = cols.map(c => c.key);
    // index, state, memory, disk, cpu, uptime mirror legacy columns;
    // host and actions are slice-2 additions (host = legacy CF Cell
    // surrogate sourced from StAppStat.host; actions hosts the Kill
    // kebab).
    expect(keys).toEqual(['index', 'state', 'memory', 'disk', 'cpu', 'uptime', 'host', 'actions']);
  });

  it('columns expose sortField for index, state, memory, disk, cpu, uptime, host', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const sortable = cols.filter(c => c.sortField != null).map(c => c.key);
    // Same sort axes as legacy (index, state, memory, disk, cpu,
    // uptime) plus host (slice-2 addition since the column is now
    // first-class on StAppStat). 'actions' has no sortField.
    expect(sortable).toEqual(['index', 'state', 'memory', 'disk', 'cpu', 'uptime', 'host']);
  });

  it('Index column renders the row index as a string', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const indexCol = cols.find(c => c.key === 'index')!;
    expect(indexCol.render(makeStat({ index: 7 }))).toBe('7');
  });

  it('actions column has kind=actions and a non-empty actions factory', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const actionsCol = cols.find(c => c.key === 'actions')!;
    expect(actionsCol.kind).toBe('actions');
    expect(typeof actionsCol.actions).toBe('function');
  });

  // ---------------------------------------------------------------------------
  // Kill row action
  // ---------------------------------------------------------------------------

  it('Kill row action invokes actionsService.killInstance(row.index)', async () => {
    const { svc, actions } = configure();
    const row = makeStat({ index: 4 });
    const rowActions = svc.buildRowActions(row);
    expect(rowActions.length).toBe(1);
    expect(rowActions[0].label).toBe('Kill');

    await rowActions[0].invoke(row);

    expect(actions.killInstance).toHaveBeenCalledTimes(1);
    expect(actions.killInstance).toHaveBeenCalledWith(4);
  });

  it('Kill row action returns disabled=true when actionsService.inFlight() is true', () => {
    const actions = makeActionsServiceStub();
    actions.inFlight.set(true);
    const { svc } = configure({ actions });

    const row = makeStat({ index: 0 });
    const rowActions = svc.buildRowActions(row);
    expect(rowActions[0].disabled).toBe(true);
  });

  it('Kill row action returns disabled=false when no kill is in flight', () => {
    const { svc } = configure();
    const row = makeStat({ index: 0 });
    const rowActions = svc.buildRowActions(row);
    expect(rowActions[0].disabled).toBe(false);
  });

  it('Kill row action is danger-styled', () => {
    const { svc } = configure();
    const rowActions = svc.buildRowActions(makeStat());
    expect(rowActions[0].danger).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  it('nameFilter narrows the view by state substring (matches legacy "Filter by State")', () => {
    const data = makeDataServiceStub([
      makeStat({ index: 0, state: 'RUNNING' }),
      makeStat({ index: 1, state: 'CRASHED' }),
      makeStat({ index: 2, state: 'STARTING' }),
    ]);
    const { svc } = configure({ data });
    // Effect flushes nameFilter() into filter() — needs a tick to run.
    TestBed.tick();
    expect(svc.view.totalFilteredResults()).toBe(3);

    svc.nameFilter.set('crash');
    TestBed.tick();
    expect(svc.view.totalFilteredResults()).toBe(1);
    expect(svc.view.pagedItems()[0].state).toBe('CRASHED');
  });

  it('clearFilters resets nameFilter, sort and pageIndex to defaults', () => {
    const { svc } = configure();
    svc.nameFilter.set('foo');
    svc.sort.set({ field: 'cpu', direction: 'desc' });
    svc.pageIndex.set(3);

    svc.clearFilters();

    expect(svc.nameFilter()).toBe('');
    expect(svc.sort().field).toBe('index');
    expect(svc.sort().direction).toBe('asc');
    expect(svc.pageIndex()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------------

  it('refresh() delegates to dataService.refresh("stats")', async () => {
    const { svc, data } = configure();
    await svc.refresh();
    expect(data.refresh).toHaveBeenCalledWith('stats');
  });
});
