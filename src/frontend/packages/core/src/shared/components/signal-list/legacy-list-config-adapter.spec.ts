import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject, of as observableOf } from 'rxjs';

import { IListConfig, ListViewTypes } from '../list/list.component.types';
import type { IListDataSource } from '../list/data-sources-controllers/list-data-source-types';
import {
  __resetAdapterWarningsForTest,
  adaptLegacyListConfig,
} from './legacy-list-config-adapter';

interface Row { id: string; name: string }

function makeMockDataSource(initialRows: Row[] = []): IListDataSource<Row> & {
  __pagination$: BehaviorSubject<any>;
  __page$: BehaviorSubject<Row[]>;
  __filter$: BehaviorSubject<any>;
  __sort$: BehaviorSubject<any>;
  __isLoadingPage$: BehaviorSubject<boolean>;
  refresh: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  showAllAfterMax: ReturnType<typeof vi.fn>;
} {
  const pagination = {
    totalResults: initialRows.length,
    currentPage: 1,
    pageCount: 1,
    pageRequests: {},
    ids: { 1: initialRows.map(r => r.id) },
    params: { 'results-per-page': 10 },
    isListPagination: true,
    clientPagination: {
      pageSize: 10,
      currentPage: 1,
      filter: { string: '', items: {} },
      totalResults: initialRows.length,
    },
    maxedState: { isMaxedMode: false, ignoreMaxed: false },
  };
  const pagination$ = new BehaviorSubject<any>(pagination);
  const page$ = new BehaviorSubject<Row[]>(initialRows);
  const filter$ = new BehaviorSubject<any>({ string: '', items: {}, filterKey: '' });
  const sort$ = new BehaviorSubject<any>({ field: 'name', direction: 'asc' });
  const isLoadingPage$ = new BehaviorSubject<boolean>(false);

  const ds = {
    isLocal: true,
    pagination$,
    page$,
    isLoadingPage$,
    filter$,
    sort$,
    maxedResults$: observableOf(false),
    maxedStateStartAt$: observableOf(null),
    isAdding$: observableOf(false),
    isSelecting$: observableOf(false),
    selectedRows: () => new Map(),
    selectClear: () => {},
    entityKey: 'mock',
    paginationKey: 'mock',
    entitySelectConfig: undefined,
    sourceScheme: undefined,
    rowsState: undefined,
    getRowState: undefined,
    action: { type: 'MOCK' } as any,
    trackBy: (_: number, r: Row) => r.id,
    getRowUniqueId: (r: Row) => r.id,
    connect: () => observableOf([]),
    disconnect: () => {},
    destroy: vi.fn(),
    refresh: vi.fn(),
    showAllAfterMax: vi.fn(),
    setFilterParam: () => {},
    getFilterFromParams: () => '',
    setMultiFilter: () => {},
    updateMetricsAction: () => {},
    __pagination$: pagination$,
    __page$: page$,
    __filter$: filter$,
    __sort$: sort$,
    __isLoadingPage$: isLoadingPage$,
  };
  return ds as any;
}

function makeMockConfig(ds: IListDataSource<Row>): IListConfig<Row> {
  return {
    getDataSource: () => ds,
    getColumns: () => [
      {
        columnId: 'name',
        headerCell: () => 'Name',
        cellDefinition: { valuePath: 'name' },
        sort: true,
      },
    ],
    getGlobalActions: () => [],
    getMultiActions: () => [],
    getSingleActions: () => [],
    getMultiFiltersConfigs: () => [],
    viewType: ListViewTypes.BOTH,
    enableTextFilter: true,
  } as any;
}

describe('adaptLegacyListConfig', () => {
  beforeEach(() => {
    __resetAdapterWarningsForTest();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore({ initialState: {} }),
      ],
    });
  });

  it('exposes pagedItems sourced from dataSource.page$', () => {
    const ds = makeMockDataSource([{ id: 'r1', name: 'one' }, { id: 'r2', name: 'two' }]);
    const injector = TestBed.inject(Injector);
    const cfg = adaptLegacyListConfig(makeMockConfig(ds), { injector });
    expect(cfg.pagedItems().length).toBe(2);
    expect(cfg.pagedItems()[0].id).toBe('r1');
  });

  it('emits new pagedItems when the data source emits', async () => {
    const ds = makeMockDataSource([{ id: 'r1', name: 'one' }]);
    const injector = TestBed.inject(Injector);
    const cfg = adaptLegacyListConfig(makeMockConfig(ds), { injector });
    expect(cfg.pagedItems().length).toBe(1);
    ds.__page$.next([
      { id: 'r1', name: 'one' },
      { id: 'r2', name: 'two' },
    ]);
    expect(cfg.pagedItems().length).toBe(2);
  });

  it('totalFilteredResults reflects the pagination total', () => {
    const ds = makeMockDataSource([{ id: 'r1', name: 'one' }]);
    const injector = TestBed.inject(Injector);
    const cfg = adaptLegacyListConfig(makeMockConfig(ds), { injector });
    expect(cfg.totalFilteredResults()).toBe(1);
  });

  it('maps a column with cellDefinition.valuePath into a SignalListColumn', () => {
    const ds = makeMockDataSource([{ id: 'r1', name: 'one' }]);
    const injector = TestBed.inject(Injector);
    const cfg = adaptLegacyListConfig(makeMockConfig(ds), { injector });
    expect(cfg.columns.length).toBe(1);
    expect(cfg.columns[0].header).toBe('Name');
    expect(cfg.columns[0].render({ id: 'x', name: 'rendered' })).toBe('rendered');
    expect(cfg.columns[0].sortField).toBe('name');
  });

  it('drops a column with cellComponent only and warns once', () => {
    const ds = makeMockDataSource([]);
    const legacy = makeMockConfig(ds);
    legacy.getColumns = () => [
      { columnId: 'custom', headerCell: () => 'Custom', cellComponent: class {} } as any,
      { columnId: 'name', headerCell: () => 'Name', cellDefinition: { valuePath: 'name' } } as any,
    ];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const injector = TestBed.inject(Injector);
    const cfg = adaptLegacyListConfig(legacy, { injector });
    expect(cfg.columns.length).toBe(1);
    expect(cfg.columns[0].header).toBe('Name');
    expect(warn).toHaveBeenCalledTimes(1);
    // Second call from another adapter invocation should not re-warn for the
    // same columnId — guarded by the module-level Set.
    adaptLegacyListConfig(legacy, { injector });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('onRefresh triggers dataSource.refresh()', () => {
    const ds = makeMockDataSource([]);
    const injector = TestBed.inject(Injector);
    const cfg = adaptLegacyListConfig(makeMockConfig(ds), { injector });
    expect(typeof cfg.onRefresh).toBe('function');
    cfg.onRefresh!();
    expect(ds.refresh).toHaveBeenCalled();
  });

  it('hides onRefresh when legacy config sets hideRefresh=true', () => {
    const ds = makeMockDataSource([]);
    const legacy = makeMockConfig(ds);
    (legacy as any).hideRefresh = true;
    const injector = TestBed.inject(Injector);
    const cfg = adaptLegacyListConfig(legacy, { injector });
    expect(cfg.onRefresh).toBeUndefined();
  });

  it('exposes a sidecar maxedState that mirrors the data source', () => {
    const ds = makeMockDataSource([]);
    const injector = TestBed.inject(Injector);
    const cfg = adaptLegacyListConfig(makeMockConfig(ds), { injector });
    expect(cfg.legacy.maxedState.isMaxedMode()).toBe(false);
    expect(cfg.legacy.maxedState.ignoreMaxed()).toBe(false);
    cfg.legacy.maxedState.showAllAfterMax();
    expect(ds.showAllAfterMax).toHaveBeenCalled();
  });

  it('default view mode falls back to "table" when legacy config does not set defaultView', () => {
    const ds = makeMockDataSource([]);
    const injector = TestBed.inject(Injector);
    const cfg = adaptLegacyListConfig(makeMockConfig(ds), { injector });
    expect(cfg.viewMode!()).toBe('table');
  });

  it('honors explicit defaultViewMode option', () => {
    const ds = makeMockDataSource([]);
    const injector = TestBed.inject(Injector);
    const cfg = adaptLegacyListConfig(makeMockConfig(ds), { injector, defaultViewMode: 'card' });
    expect(cfg.viewMode!()).toBe('card');
  });

  it('legacy.refresh and legacy.destroy delegate to the data source', () => {
    const ds = makeMockDataSource([]);
    const injector = TestBed.inject(Injector);
    const cfg = adaptLegacyListConfig(makeMockConfig(ds), { injector });
    cfg.legacy.refresh();
    cfg.legacy.destroy();
    expect(ds.refresh).toHaveBeenCalled();
    expect(ds.destroy).toHaveBeenCalled();
  });
});
