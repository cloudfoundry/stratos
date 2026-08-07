import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ConfirmationDialogService, CurrentUserPermissionsService, TabNavService, TailwindSnackBarService } from '@stratosui/core';
import { of } from 'rxjs';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { CloudFoundrySpaceAppsSignalComponent } from './cloud-foundry-space-apps-signal.component';
import { CfAppsSignalConfigService } from '../../../../../../../shared/signal-list-configs/app/cf-apps-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';

// Mirrors the mock in bulk-progress.spec.ts / cloud-foundry-applications-signal.component.spec.ts:
// show/open/error recorded separately (runBulkWithProgress calls each for a
// different phase) and a ref exposing update/dismiss for the in-place
// progress snackbar.
function makeSnackBar() {
  const ref = { update: vi.fn(), dismiss: vi.fn(), afterDismissed: vi.fn(), onAction: vi.fn(), dismissWithAction: vi.fn() };
  return { ref, open: vi.fn(() => ref), show: vi.fn(() => ref), error: vi.fn(() => ref) };
}
const flush = async (n = 16) => { for (let i = 0; i < n; i++) { await Promise.resolve(); } };

function makeStubAppsConfig() {
  const pageIndex = signal(0);
  const pageSize = signal(6);
  const filterSig = signal(() => true);
  const sortSig = signal({ field: 'name' as const, direction: 'asc' as const });
  const view = {
    pagedItems: signal([]).asReadonly(),
    filteredItems: signal([]).asReadonly(),
    totalFilteredResults: signal(0).asReadonly(),
    totalPages: signal(1).asReadonly(),
    totalItems: signal(0).asReadonly(),
  };
  const orchestrator = {
    isAnyLoading: signal(false).asReadonly(),
    errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
  };
  const stats = signal(new Map<string, { running: number; total: number }>());
  const allOption = { label: 'All', value: null };
  return {
    initialize: vi.fn(),
    initializeForSpace: vi.fn(),
    clearLockedSpace: vi.fn(),
    loadAll: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    deleteApp: vi.fn().mockResolvedValue(undefined),
    bulkDeleteApps: vi.fn().mockResolvedValue({ results: [], succeeded: 0, failed: 0, pending: 0 }),
    startStatsPolling: vi.fn(),
    appStats: stats,
    filter: filterSig,
    sort: sortSig,
    pageSize,
    pageIndex,
    view,
    orchestrator,
    nameFilter: signal(''),
    viewMode: signal<'card' | 'table'>('card'),
    selectedStacks: signal<string[] | null>(null),
    stackUiVisible: signal(false).asReadonly(),
    stackOptions: signal([allOption]).asReadonly(),
  };
}

describe('CloudFoundrySpaceAppsSignalComponent', () => {
  let component: CloudFoundrySpaceAppsSignalComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceAppsSignalComponent>;
  let stubAppsConfig: ReturnType<typeof makeStubAppsConfig>;
  let snackBar: ReturnType<typeof makeSnackBar>;

  beforeEach(async () => {
    stubAppsConfig = makeStubAppsConfig();
    snackBar = makeSnackBar();
    const stubEndpointService = { cfGuid: 'cnsi-1' } as any;
    const stubSpaceService = { spaceGuid: 'space-1', cfGuid: 'cnsi-1', orgGuid: 'org-1' } as any;
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundrySpaceAppsSignalComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        TabNavService,
        { provide: CfAppsSignalConfigService, useValue: stubAppsConfig },
        { provide: CloudFoundryEndpointService, useValue: stubEndpointService },
        { provide: CloudFoundrySpaceService, useValue: stubSpaceService },
        { provide: CurrentUserPermissionsService, useValue: { can: () => of(true) } },
        { provide: TailwindSnackBarService, useValue: snackBar },
        // The confirm dialog normally opens a modal and waits for the user;
        // the harness fires the confirm callback immediately so the bulk
        // action's run() drives straight into runBulk/runBulkWithProgress.
        { provide: ConfirmationDialogService, useValue: { open: (_cfg: unknown, doFn: () => void) => doFn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CloudFoundrySpaceAppsSignalComponent);
    component = fixture.componentInstance;
    // Angular runs ngOnInit during detectChanges; the component's
    // initializeForSpace call doesn't await anything, so we can flush
    // synchronously for assertions.
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('initializes the apps config service for the route-scoped CF + space', async () => {
    stubAppsConfig.initializeForSpace.mockClear();
    await component.ngOnInit();
    expect(stubAppsConfig.initializeForSpace).toHaveBeenCalledTimes(1);
    expect(stubAppsConfig.initializeForSpace).toHaveBeenCalledWith('cnsi-1', 'space-1');
  });

  it('builds a SignalListConfig with the per-space columns (no CF/Org/Space dropdowns)', async () => {
    await component.ngOnInit();
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();
    expect(cfg!.columns.map(c => c.header)).toEqual([
      '', 'Name', 'Status', 'Instances', 'Memory', 'Disk', 'Created', '', '',
    ]);
    // No filter dropdowns — single-CNSI single-space tab.
    expect(cfg!.filterDropdowns).toBeUndefined();
    // Row key matches the multi-CNSI shape so favorites carry across.
    expect(cfg!.getRowKey({
      cnsiGuid: 'cnsi-1', guid: 'app-1', name: 'a', state: 'STARTED',
      spaceGuid: 'space-1', instances: 1, createdAt: '', updatedAt: '',
    } as any)).toBe('cnsi-1:app-1');
  });

  it('defaults to card view at page size 6 for the per-space presentation', async () => {
    // Munge the signals to non-defaults first so we can prove ngOnInit sets them.
    stubAppsConfig.viewMode.set('table');
    stubAppsConfig.pageSize.set(25);
    await component.ngOnInit();
    expect(stubAppsConfig.viewMode()).toBe('card');
    expect(stubAppsConfig.pageSize()).toBe(6);
  });

  it('renders the Instances column as running / desired when stats are present', async () => {
    await component.ngOnInit();
    const cfg = component.listConfig();
    const instCol = cfg!.columns.find(c => c.key === 'instances');
    expect(instCol).toBeDefined();
    const app: any = {
      cnsiGuid: 'cnsi-1', guid: 'app-1', name: 'a', state: 'STARTED',
      spaceGuid: 'space-1', instances: 3, createdAt: '', updatedAt: '',
    };
    // No stats yet → em-dash placeholder.
    expect(instCol!.render!(app)).toBe('— / 3');
    stubAppsConfig.appStats.set(new Map([['cnsi-1:app-1', { running: 2, total: 3 }]]));
    expect(instCol!.render!(app)).toBe('2 / 3');
  });

  // GUARD: bulk delete has been silently dropped from this tab multiple
  // times because nothing asserted the multi-select affordance survived a
  // refactor. This test fails if the checkbox selection column OR the bulk
  // delete action goes missing.
  it('exposes a checkbox selection column and a non-empty bulk delete action', async () => {
    await component.ngOnInit();
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();

    // Multi-select requires a kind:'checkbox' column.
    const checkboxCol = cfg!.columns.find(c => c.kind === 'checkbox');
    expect(checkboxCol).toBeDefined();

    // bulkActions must be present and carry a delete action.
    expect(cfg!.bulkActions).toBeDefined();
    expect(cfg!.bulkActions!.length).toBeGreaterThan(0);
    const deleteAction = cfg!.bulkActions!.find(
      a => (a.dataTest ?? a.label).toLowerCase().includes('delete'),
    );
    expect(deleteAction).toBeDefined();
    expect(deleteAction!.label).toBe('Delete');
  });

  // Bulk delete now reports the settled outcome via runBulkWithProgress
  // (Task 4), not the old "N applications delete requested" fire-and-forget
  // wording — a CF delete accepted async settles for real once its job
  // completes, and the summary should say so.
  it('bulk delete reports settled outcome wording, not "requested"', async () => {
    const targets: any[] = [
      { cnsiGuid: 'cnsi-1', guid: 'app-1', name: 'app-1', state: 'STARTED', spaceGuid: 'space-1', instances: 1, createdAt: '', updatedAt: '' },
      { cnsiGuid: 'cnsi-1', guid: 'app-2', name: 'app-2', state: 'STARTED', spaceGuid: 'space-1', instances: 1, createdAt: '', updatedAt: '' },
    ];
    stubAppsConfig.view.filteredItems = signal(targets).asReadonly();
    stubAppsConfig.bulkDeleteApps.mockResolvedValue({
      results: [
        { guid: 'app-1', state: 'COMPLETE' },
        { guid: 'app-2', state: 'COMPLETE' },
      ],
      succeeded: 2,
      failed: 0,
      pending: 0,
    });

    await component.ngOnInit();
    const cfg = component.listConfig();
    const deleteAction = cfg!.bulkActions!.find(a => a.label === 'Delete');
    expect(deleteAction).toBeDefined();

    deleteAction!.run(new Set(['cnsi-1:app-1', 'cnsi-1:app-2']));
    await flush();

    expect(stubAppsConfig.bulkDeleteApps).toHaveBeenCalledWith('cnsi-1', ['app-1', 'app-2']);
    expect(snackBar.show).toHaveBeenCalledWith('2 applications deleted');
    const allCalls = [...snackBar.open.mock.calls, ...snackBar.show.mock.calls, ...snackBar.error.mock.calls]
      .map(c => c[0]);
    expect(allCalls.join(' ')).not.toContain('requested');
  });

  it('formatMb returns human-friendly units and ∞ for unlimited', () => {
    expect(CloudFoundrySpaceAppsSignalComponent.formatMb(512)).toBe('512 MB');
    expect(CloudFoundrySpaceAppsSignalComponent.formatMb(2048)).toBe('2.0 GB');
    expect(CloudFoundrySpaceAppsSignalComponent.formatMb(-1)).toBe('∞');
    expect(CloudFoundrySpaceAppsSignalComponent.formatMb(undefined)).toBe('—');
  });
});
