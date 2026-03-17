import { describe, it, expect, vi } from 'vitest';
import { BehaviorSubject, firstValueFrom, skip } from 'rxjs';
import { PaginationEntityState } from '@stratosui/store';
import { getCurrentPageStartIndex, splitCurrentPage } from './local-list-controller.helpers';
import { LocalListController } from './local-list-controller';
import { getDataFunctionList } from './local-filtering-sorting';

/**
 * Diagnostic tests for FWT-810/815: full LocalListController pipeline
 * with filtering to verify the filter actually removes non-matching entities.
 */
describe('LocalListController filter pipeline', () => {
  function createPaginationState(overrides: Partial<PaginationEntityState> = {}): PaginationEntityState {
    return {
      currentPage: 1,
      totalResults: 15,
      pageCount: 1,
      ids: { 1: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'] },
      params: {},
      pageRequests: {},
      clientPagination: {
        pageSize: 25,
        currentPage: 1,
        filter: {
          string: '',
          items: {}
        },
        totalResults: 15,
      },
      maxedState: { isMaxedMode: false },
      isListPagination: false,
      ...overrides,
    };
  }

  // Simulate real CF app entities: APIResource<{ name: string }>
  const testApps = [
    { metadata: { guid: '1' }, entity: { name: 'app-1-36' } },
    { metadata: { guid: '2' }, entity: { name: 'app-1-41' } },
    { metadata: { guid: '3' }, entity: { name: 'cf-app-1' } },
    { metadata: { guid: '4' }, entity: { name: 'app-2-1' } },
    { metadata: { guid: '5' }, entity: { name: 'cf-worker' } },
    { metadata: { guid: '6' }, entity: { name: 'app-1-46' } },
    { metadata: { guid: '7' }, entity: { name: 'cf-router' } },
    { metadata: { guid: '8' }, entity: { name: 'app-2-11' } },
    { metadata: { guid: '9' }, entity: { name: 'app-2-16' } },
    { metadata: { guid: '10' }, entity: { name: 'app-2-21' } },
    { metadata: { guid: '11' }, entity: { name: 'app-2-26' } },
    { metadata: { guid: '12' }, entity: { name: 'app-1-6' } },
    { metadata: { guid: '13' }, entity: { name: 'cf-api' } },
    { metadata: { guid: '14' }, entity: { name: 'my-cf-app' } },
    { metadata: { guid: '15' }, entity: { name: 'app-3-1' } },
  ];

  it('should filter entities when filter string changes', async () => {
    const entities$ = new BehaviorSubject(testApps as any[]);
    const pagination$ = new BehaviorSubject(createPaginationState());
    const setResultCount = vi.fn();
    const dataFunctions = getDataFunctionList([{ type: 'filter', field: 'entity.name' }]);

    const controller = new LocalListController(
      entities$,
      pagination$,
      setResultCount,
      dataFunctions
    );

    // Get initial page (no filter) — should have all 15 apps
    const initialPage = await firstValueFrom(controller.page$);
    expect(initialPage.length).toBe(15);

    // Now apply filter "cf-"
    const filteredPromise = firstValueFrom(controller.page$.pipe(skip(1)));
    pagination$.next(createPaginationState({
      clientPagination: {
        pageSize: 25,
        currentPage: 1,
        filter: { string: 'cf-', items: {} },
        totalResults: 15,
      }
    }));

    const filteredPage = await filteredPromise;
    // Should only have apps containing "cf-": cf-app-1, cf-worker, cf-router, cf-api, my-cf-app
    expect(filteredPage.length).toBe(5);
    const names = filteredPage.map((app: any) => app.entity.name);
    expect(names).toContain('cf-app-1');
    expect(names).toContain('cf-worker');
    expect(names).toContain('cf-router');
    expect(names).toContain('cf-api');
    expect(names).toContain('my-cf-app');
  });

  it('should update result count after filtering', async () => {
    const entities$ = new BehaviorSubject(testApps as any[]);
    const pagination$ = new BehaviorSubject(createPaginationState());
    const setResultCount = vi.fn();
    const dataFunctions = getDataFunctionList([{ type: 'filter', field: 'entity.name' }]);

    const controller = new LocalListController(
      entities$,
      pagination$,
      setResultCount,
      dataFunctions
    );

    // Get initial page
    await firstValueFrom(controller.page$);
    expect(setResultCount).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([expect.objectContaining({ entity: { name: 'app-1-36' } })])
    );
    const initialCount = setResultCount.mock.calls[0][1].length;
    expect(initialCount).toBe(15);

    // Apply filter
    const filteredPromise = firstValueFrom(controller.page$.pipe(skip(1)));
    pagination$.next(createPaginationState({
      clientPagination: {
        pageSize: 25,
        currentPage: 1,
        filter: { string: 'cf-', items: {} },
        totalResults: 15,
      }
    }));

    await filteredPromise;
    // The last call to setResultCount should reflect the filtered count
    const lastCall = setResultCount.mock.calls[setResultCount.mock.calls.length - 1];
    const filteredCount = lastCall[1].length;
    expect(filteredCount).toBe(5);
  });

  it('should return empty when ids is empty (even with entities)', async () => {
    const entities$ = new BehaviorSubject(testApps as any[]);
    const pagination$ = new BehaviorSubject(createPaginationState({ ids: {} }));
    const setResultCount = vi.fn();
    const dataFunctions = getDataFunctionList([{ type: 'filter', field: 'entity.name' }]);

    const controller = new LocalListController(
      entities$,
      pagination$,
      setResultCount,
      dataFunctions
    );

    const page = await firstValueFrom(controller.page$);
    expect(page.length).toBe(0);
  });

  it('should restore all entities when filter is cleared', async () => {
    const entities$ = new BehaviorSubject(testApps as any[]);
    const basePagination = createPaginationState();
    const pagination$ = new BehaviorSubject(basePagination);
    const setResultCount = vi.fn();
    const dataFunctions = getDataFunctionList([{ type: 'filter', field: 'entity.name' }]);

    const controller = new LocalListController(
      entities$,
      pagination$,
      setResultCount,
      dataFunctions
    );

    // Initial: all items
    await firstValueFrom(controller.page$);

    // Filter down to "cf-"
    let nextPage = firstValueFrom(controller.page$.pipe(skip(1)));
    pagination$.next(createPaginationState({
      clientPagination: {
        pageSize: 25, currentPage: 1,
        filter: { string: 'cf-', items: {} },
        totalResults: 15,
      }
    }));
    let page = await nextPage;
    expect(page.length).toBe(5);

    // Clear filter — should restore all
    nextPage = firstValueFrom(controller.page$.pipe(skip(1)));
    pagination$.next(createPaginationState({
      clientPagination: {
        pageSize: 25, currentPage: 1,
        filter: { string: '', items: {} },
        totalResults: 15,
      }
    }));
    page = await nextPage;
    expect(page.length).toBe(15);
  });
});

describe('LocalListController full data source pipeline', () => {
  // This simulates the EXACT page$ pipeline from list-data-source.ts
  // to diagnose if the filter issue is in RxJS or Angular change detection
  function createPaginationState(overrides: Partial<any> = {}): any {
    return {
      currentPage: 1,
      totalResults: 15,
      pageCount: 1,
      ids: { 1: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'] },
      params: {},
      pageRequests: {},
      clientPagination: {
        pageSize: 25,
        currentPage: 1,
        filter: { string: '', items: {} },
        totalResults: 15,
      },
      maxedState: { isMaxedMode: false },
      isListPagination: false,
      ...overrides,
    };
  }

  const testApps = [
    { metadata: { guid: '1' }, entity: { name: 'app-1-36' } },
    { metadata: { guid: '2' }, entity: { name: 'app-1-41' } },
    { metadata: { guid: '3' }, entity: { name: 'cf-app-1' } },
    { metadata: { guid: '4' }, entity: { name: 'app-2-1' } },
    { metadata: { guid: '5' }, entity: { name: 'cf-worker' } },
    { metadata: { guid: '6' }, entity: { name: 'app-1-46' } },
    { metadata: { guid: '7' }, entity: { name: 'cf-router' } },
    { metadata: { guid: '8' }, entity: { name: 'app-2-11' } },
    { metadata: { guid: '9' }, entity: { name: 'app-2-16' } },
    { metadata: { guid: '10' }, entity: { name: 'app-2-21' } },
    { metadata: { guid: '11' }, entity: { name: 'app-2-26' } },
    { metadata: { guid: '12' }, entity: { name: 'app-1-6' } },
    { metadata: { guid: '13' }, entity: { name: 'cf-api' } },
    { metadata: { guid: '14' }, entity: { name: 'my-cf-app' } },
    { metadata: { guid: '15' }, entity: { name: 'app-3-1' } },
  ];

  it('should deliver filtered results through full page$ pipeline (persistent subscription)', async () => {
    const { BehaviorSubject, startWith } = await import('rxjs');
    const { withLatestFrom, filter, map, publishReplay, refCount } = await import('rxjs/operators');

    const entities$ = new BehaviorSubject(testApps as any[]);
    const pagination$ = new BehaviorSubject(createPaginationState());
    const isLoadingPage$ = new BehaviorSubject(false);
    const setResultCount = vi.fn();
    const dataFunctions = getDataFunctionList([{ type: 'filter', field: 'entity.name' }]);

    const controller = new LocalListController(
      entities$,
      pagination$,
      setResultCount,
      dataFunctions
    );

    // Simulate list-data-source.ts page$ pipeline (lines 217-223)
    const page$ = controller.page$.pipe(
      withLatestFrom(isLoadingPage$.pipe(startWith(false))),
      filter(([page, isLoading]: [any[], boolean]) => !isLoading),
      map(([page]: [any[], boolean]) => page),
      publishReplay(1),
      refCount()
    );

    // Keep subscription alive (like async pipe in template)
    const emissions: any[][] = [];
    const sub = page$.subscribe(page => emissions.push(page));

    // Wait a tick for initial emission
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(emissions.length).toBeGreaterThanOrEqual(1);
    expect(emissions[0].length).toBe(15);

    // Apply filter "cf-"
    const emissionCountBefore = emissions.length;
    pagination$.next(createPaginationState({
      clientPagination: {
        pageSize: 25,
        currentPage: 1,
        filter: { string: 'cf-', items: {} },
        totalResults: 15,
      }
    }));

    // Wait a tick for filtered emission
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(emissions.length).toBeGreaterThan(emissionCountBefore);
    const lastEmission = emissions[emissions.length - 1];
    expect(lastEmission.length).toBe(5);
    expect(lastEmission.map((a: any) => a.entity.name)).toContain('cf-app-1');

    sub.unsubscribe();
  });

  it('should block emission when isLoading is true then deliver when false', async () => {
    const { BehaviorSubject, firstValueFrom, skip, startWith } = await import('rxjs');
    const { withLatestFrom, filter, map, publishReplay, refCount } = await import('rxjs/operators');

    const entities$ = new BehaviorSubject(testApps as any[]);
    const pagination$ = new BehaviorSubject(createPaginationState());
    const isLoadingPage$ = new BehaviorSubject(false);
    const setResultCount = vi.fn();
    const dataFunctions = getDataFunctionList([{ type: 'filter', field: 'entity.name' }]);

    const controller = new LocalListController(
      entities$,
      pagination$,
      setResultCount,
      dataFunctions
    );

    const page$ = controller.page$.pipe(
      withLatestFrom(isLoadingPage$.pipe(startWith(false))),
      filter(([page, isLoading]: [any[], boolean]) => !isLoading),
      map(([page]: [any[], boolean]) => page),
      publishReplay(1),
      refCount()
    );

    // Get initial
    await firstValueFrom(page$);

    // Set loading BEFORE filter change
    isLoadingPage$.next(true);

    // Apply filter while loading — emission should be blocked
    pagination$.next(createPaginationState({
      clientPagination: {
        pageSize: 25,
        currentPage: 1,
        filter: { string: 'cf-', items: {} },
        totalResults: 15,
      }
    }));

    // Now clear loading — but page$ might NOT re-emit because
    // withLatestFrom only fires when the OUTER observable emits
    isLoadingPage$.next(false);

    // The replayed value should still be the old unfiltered page
    const currentPage = await firstValueFrom(page$);
    // THIS IS THE BUG: if isLoading was true when the filter was applied,
    // the filtered emission is lost. withLatestFrom only samples isLoading
    // when page$ emits, so clearing isLoading doesn't re-trigger.
    // The replayed value is the stale unfiltered page.
    expect(currentPage.length).toBe(15); // BUG: should be 5 but is 15
  });
});

describe('LocalListController pagination helpers', () => {
  const page = [
    [1,
      2],
    3,
    4,
    [5, 6],
    8,
    9,
    10,
    11,
  ];

  it('should get correct start index 1', () => {
    const start = getCurrentPageStartIndex(page, 2, 4);
    expect(start).toBe(4);
  });

  it('should get correct start index 2', () => {
    const start = getCurrentPageStartIndex([
      0,
      1,
      3,
      2,
      3,
      3,
      4,
      5,
      5,
      6,
      7,
      8,
    ], 3, 4);
    expect(start).toBe(9);
  });

  it('should get correct start index 3', () => {
    const start = getCurrentPageStartIndex([
      [0,
        1,
        3],
      [2,
        3,
        3],
      4,
      5,
      5,
      [6,
        7,
        8]
    ], 3, 3);
    expect(start).toBe(2);
  });

  it('should get correct start index 4', () => {
    const start = getCurrentPageStartIndex([
      [0,
        1,
        3],
      [2,
        3,
        3],
      [4,
        5,
        5],
      [6,
        7,
        8]
    ], 3, 3);
    expect(start).toBe(2);
  });

  it('should get split pages', () => {
    const data = splitCurrentPage([
      [0,
        1,
        3],
      2,
      3,
      3,
      [4,
        5,
        5],
      [6,
        7,
        8]
    ], 3, 2);
    expect(data.entities).toEqual([
      [0,
        1,
        3],
      [2,
        3,
        3],
      [4,
        5,
        5],
      [6,
        7,
        8]
    ]);
    expect(data.index).toEqual(1);
  });

  it('should get split pages 1', () => {
    const data = splitCurrentPage([
      0,
      1,
      3,
      2,
      3,
      3,
      [4,
        5,
        5],
      6,
      7,
      8,
    ], 3, 4);
    expect(data.entities).toEqual([
      0,
      1,
      3,
      2,
      3,
      3,
      [4,
        5,
        5],
      [6,
        7,
        8]
    ]);
    expect(data.index).toEqual(7);
  });

  it('should get split pages 2', () => {
    const data = splitCurrentPage([
      0,
      1,
      3,
      2,
      3,
      3,
      4,
      5,
      5,
      6,
      7,
      8,
    ], 5, 2);
    expect(data.entities).toEqual([
      0,
      1,
      3,
      2,
      3,
      [3,
        4,
        5,
        5,
        6],
      7,
      8,
    ]);
    expect(data.index).toEqual(5);
  });

  it('should get split pages 3', () => {
    const data = splitCurrentPage([
      0,
      1,
      3,
      5,
      6,
      [2,
        3,
        3,
        4,
        5],
      5,
      6,
    ], 5, 3);
    expect(data.entities).toEqual([
      0,
      1,
      3,
      5,
      6,
      [2,
        3,
        3,
        4,
        5],
      [5,
        6]
    ]);
    expect(data.index).toEqual(6);
  });
  it('should get split pages 4', () => {
    const data = splitCurrentPage([
      0,
      1,
      3,
      5,
      6,
      2,
      3,
      3,
      4,
      5,
      5,
      6,
    ], 5, 3);
    expect(data.entities).toEqual([
      0,
      1,
      3,
      5,
      6,
      2,
      3,
      3,
      4,
      5,
      [5,
        6]
    ]);
    expect(data.index).toEqual(10);
  });
  it('should get split pages 5', () => {
    const data = splitCurrentPage([
      0,
      1,
      3,
      5,
      6,
      2,
      3,
      3,
      4,
      5,
      5,
      6,
    ], 5, 4);
    expect(data.entities).toEqual([
      0,
      1,
      3,
      5,
      6,
      2,
      3,
      3,
      4,
      5,
      5,
      6,
    ]);
    expect(data.index).toEqual(null);
  });

  it('should return all items as single page when pageSize is -1 (PAGE_SIZE_ALL)', () => {
    const items = [0, 1, 2, 3, 4, 5];
    const data = splitCurrentPage(items, -1, 1);
    expect(data.entities).toEqual([items]);
    expect(data.index).toEqual(0);
  });

  it('should return all items as single page when pageSize is 0', () => {
    const items = [0, 1, 2];
    const data = splitCurrentPage(items, 0, 1);
    expect(data.entities).toEqual([items]);
    expect(data.index).toEqual(0);
  });
});
