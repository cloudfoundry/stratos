import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject, of as observableOf } from 'rxjs';

// Mock the legacy factory so the service's adapter wrapping can be tested
// without spinning up the real ngrx-backed `KubernetesEndpointsDataSource`
// (which requires entity catalog registration, pagination monitors, etc.).
//
// The spec exercises the slim signal-config wiring: lazy construction,
// stable identity across reads, dataSource accessor, and `destroy()`.
vi.mock('./kubernetes-endpoints-legacy-config.factory', () => {
  return {
    buildKubernetesEndpointsListConfig: vi.fn(() => makeFakeLegacyConfig()),
  };
});

import {
  KubernetesEndpointsSignalConfigService,
} from './kubernetes-endpoints-signal-config.service';
import {
  buildKubernetesEndpointsListConfig,
} from './kubernetes-endpoints-legacy-config.factory';

function makeFakeLegacyConfig() {
  const pagination$ = new BehaviorSubject({
    totalResults: 0,
    currentPage: 1,
    pageCount: 0,
    pageRequests: {},
    ids: {},
    params: { 'results-per-page': 9 },
    isListPagination: true,
    clientPagination: {
      pageSize: 9,
      currentPage: 1,
      filter: { string: '', items: {} },
      totalResults: 0,
    },
    maxedState: { isMaxedMode: false, ignoreMaxed: false },
  } as any);
  const ds = {
    isLocal: true,
    pagination$,
    page$: new BehaviorSubject<unknown[]>([]),
    isLoadingPage$: new BehaviorSubject<boolean>(false),
    filter$: new BehaviorSubject({ string: '', items: {}, filterKey: '' }),
    sort$: new BehaviorSubject({ field: 'name', direction: 'asc' }),
    maxedResults$: observableOf(false),
    maxedStateStartAt$: observableOf(null),
    isAdding$: observableOf(false),
    isSelecting$: observableOf(false),
    selectedRows: () => new Map(),
    selectClear: () => {},
    entityKey: 'mock-endpoints',
    paginationKey: 'kube-endpoints',
    entitySelectConfig: undefined,
    sourceScheme: undefined,
    rowsState: undefined,
    getRowState: undefined,
    action: { type: 'MOCK' },
    trackBy: (_: number, r: unknown) => (r as { guid?: string })?.guid ?? '',
    getRowUniqueId: (r: unknown) => (r as { guid?: string })?.guid ?? '',
    connect: () => observableOf([]),
    disconnect: () => {},
    destroy: vi.fn(),
    refresh: vi.fn(),
    showAllAfterMax: vi.fn(),
    setFilterParam: () => {},
    getFilterFromParams: () => '',
    setMultiFilter: () => {},
    updateMetricsAction: () => {},
  };
  return {
    isLocal: true,
    cardComponent: class {},
    text: { title: '', filter: 'Filter Endpoints', noEntries: 'There are no endpoints' },
    enableTextFilter: true,
    getColumns: () => [],
    getGlobalActions: () => [],
    getMultiActions: () => [],
    getSingleActions: () => [],
    getMultiFiltersConfigs: () => [],
    getDataSource: () => ds,
  } as any;
}

describe('KubernetesEndpointsSignalConfigService', () => {
  let svc: KubernetesEndpointsSignalConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore({ initialState: {} }),
        KubernetesEndpointsSignalConfigService,
      ],
    });
    svc = TestBed.inject(KubernetesEndpointsSignalConfigService);
  });

  it('does not build the legacy config until `config` is read', () => {
    expect(buildKubernetesEndpointsListConfig).not.toHaveBeenCalled();
    expect(svc.dataSource).toBeUndefined();
  });

  it('exposes a SignalListConfig with card as the default view mode', () => {
    const cfg = svc.config;
    expect(cfg).toBeDefined();
    expect(cfg.viewMode).toBeDefined();
    expect(cfg.viewMode!()).toBe('card');
    expect(buildKubernetesEndpointsListConfig).toHaveBeenCalledTimes(1);
  });

  it('returns a stable config + dataSource reference across reads', () => {
    const a = svc.config;
    const b = svc.config;
    expect(a).toBe(b);
    expect(svc.dataSource).toBeDefined();
    expect(buildKubernetesEndpointsListConfig).toHaveBeenCalledTimes(1);
  });

  it('exposes the underlying legacy data source after `config` is read', () => {
    void svc.config;
    expect(svc.dataSource).toBeDefined();
    // The data source carries the page$ stream the EndpointCardComponent
    // binding eventually consumes; sanity-check it surfaces an empty list.
    expect(svc.dataSource!.page$).toBeDefined();
  });

  it('destroy() releases the data source and clears the cached config', () => {
    const cfg = svc.config;
    const ds = svc.dataSource;
    svc.destroy();
    expect((ds as { destroy: ReturnType<typeof vi.fn> }).destroy).toHaveBeenCalled();
    expect(svc.dataSource).toBeUndefined();
    // A subsequent read rebuilds — the factory is invoked again.
    const next = svc.config;
    expect(next).not.toBe(cfg);
    expect(buildKubernetesEndpointsListConfig).toHaveBeenCalledTimes(2);
  });
});
