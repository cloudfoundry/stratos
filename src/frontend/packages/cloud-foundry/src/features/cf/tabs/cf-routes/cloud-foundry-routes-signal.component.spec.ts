import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmationDialogService, CurrentUserPermissionsService, TabNavService, TailwindSnackBarService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { CloudFoundryRoutesSignalComponent } from './cloud-foundry-routes-signal.component';
import { CfRoutesSignalConfigService } from '../../../../shared/signal-list-configs/route/cf-routes-signal-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StRoute } from '../../../../services/endpoint-data/stratos-types';

// Mirrors the mock in bulk-progress.spec.ts / cloud-foundry-applications-signal.component.spec.ts:
// show/open/error recorded separately (runBulkWithProgress calls each for a
// different phase) and a ref exposing update/dismiss for the in-place
// progress snackbar.
function makeSnackBar() {
  const ref = { update: vi.fn(), dismiss: vi.fn(), afterDismissed: vi.fn(), onAction: vi.fn(), dismissWithAction: vi.fn() };
  return { ref, open: vi.fn(() => ref), show: vi.fn(() => ref), error: vi.fn(() => ref) };
}
const flush = async (n = 16) => { for (let i = 0; i < n; i++) { await Promise.resolve(); } };

function route(overrides: Partial<StRoute> = {}): StRoute {
  return {
    guid: 'route-1',
    url: 'my-app.example.com',
    host: 'my-app',
    path: '',
    domainGuid: 'domain-1',
    spaceGuid: 'space-1',
    cnsiGuid: 'cnsi-1',
    appGuids: ['app-1'],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function makeStubRoutesConfig() {
  const allOption = { label: 'All', value: null };
  const view = {
    pagedItems: signal([]).asReadonly(),
    filteredItems: signal([] as StRoute[]).asReadonly(),
    totalFilteredResults: signal(0).asReadonly(),
    totalPages: signal(1).asReadonly(),
    totalItems: signal(0).asReadonly(),
  };
  return {
    initialize: vi.fn(),
    refresh: vi.fn().mockResolvedValue(undefined),
    clearFilters: vi.fn(),
    registerSortExtractor: vi.fn(),
    deleteRoute: vi.fn().mockResolvedValue(undefined),
    unmapAllAppsFromRoute: vi.fn().mockResolvedValue(undefined),
    bulkDeleteRoutes: vi.fn().mockResolvedValue({ results: [], succeeded: 0, failed: 0, pending: 0 }),
    bulkUnmapRoutes: vi.fn().mockResolvedValue({ results: [], succeeded: 0, failed: 0, pending: 0 }),
    hasLoadedOnce: signal(true).asReadonly(),
    view,
    pageSize: signal(6),
    pageIndex: signal(0),
    sort: signal({ field: 'url' as const, direction: 'asc' as const }),
    nameFilter: signal(''),
    viewMode: signal<'card' | 'table'>('card'),
    selectedOrg: signal<string | null>(null),
    selectedSpace: signal<string | null>(null),
    orgOptions: signal([allOption]).asReadonly(),
    spaceOptions: signal([allOption]).asReadonly(),
    isLoadingOrgs: signal(false).asReadonly(),
    isLoadingSpaces: signal(false).asReadonly(),
    spaceNameByGuid: signal(new Map<string, string>()).asReadonly(),
    orgNameByGuid: signal(new Map<string, string>()).asReadonly(),
    orgGuidBySpaceGuid: signal(new Map<string, string>()).asReadonly(),
    endpointData: { apps: () => [] },
  };
}

describe('CloudFoundryRoutesSignalComponent', () => {
  let component: CloudFoundryRoutesSignalComponent;
  let fixture: ComponentFixture<CloudFoundryRoutesSignalComponent>;
  let stubRoutesConfig: ReturnType<typeof makeStubRoutesConfig>;
  let snackBar: ReturnType<typeof makeSnackBar>;

  beforeEach(async () => {
    stubRoutesConfig = makeStubRoutesConfig();
    snackBar = makeSnackBar();
    const stubEndpointService = { cfGuid: 'cnsi-1' } as any;
    await TestBed.configureTestingModule({
      imports: [CloudFoundryRoutesSignalComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        TabNavService,
        { provide: CfRoutesSignalConfigService, useValue: stubRoutesConfig },
        { provide: CloudFoundryEndpointService, useValue: stubEndpointService },
        { provide: CurrentUserPermissionsService, useValue: { can: () => of(true) } },
        { provide: TailwindSnackBarService, useValue: snackBar },
        // The confirm dialog normally opens a modal and waits for the user;
        // the harness fires the confirm callback immediately so the bulk
        // action's run() drives straight into runBulk/runBulkWithProgress.
        { provide: ConfirmationDialogService, useValue: { open: (_cfg: unknown, doFn: () => void) => doFn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CloudFoundryRoutesSignalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('exposes a checkbox selection column and Unmap + Delete bulk actions', () => {
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();

    const checkboxCol = cfg!.columns.find(c => c.kind === 'checkbox');
    expect(checkboxCol).toBeDefined();

    expect(cfg!.bulkActions).toBeDefined();
    expect(cfg!.bulkActions!.map(a => a.label)).toEqual(['Unmap', 'Delete']);
  });

  // Bulk delete reports the settled outcome via runBulkWithProgress (Task 4),
  // not the old "N routes delete requested" fire-and-forget wording.
  it('bulk delete: all-COMPLETE reports settled outcome, not "requested"', async () => {
    const targets: StRoute[] = [
      route({ cnsiGuid: 'cnsi-1', guid: 'route-1' }),
      route({ cnsiGuid: 'cnsi-1', guid: 'route-2' }),
    ];
    stubRoutesConfig.view.filteredItems = signal(targets).asReadonly();
    stubRoutesConfig.bulkDeleteRoutes.mockResolvedValue({
      results: [
        { guid: 'route-1', state: 'COMPLETE' },
        { guid: 'route-2', state: 'COMPLETE' },
      ],
      succeeded: 2,
      failed: 0,
      pending: 0,
    });

    const cfg = component.listConfig();
    const deleteAction = cfg!.bulkActions!.find(a => a.label === 'Delete');
    expect(deleteAction).toBeDefined();

    deleteAction!.run(new Set(['cnsi-1:route-1', 'cnsi-1:route-2']));
    await flush();

    expect(stubRoutesConfig.bulkDeleteRoutes).toHaveBeenCalledWith('cnsi-1', ['route-1', 'route-2']);
    expect(snackBar.show).toHaveBeenCalledWith('2 routes deleted');
    const allCalls = [...snackBar.open.mock.calls, ...snackBar.show.mock.calls, ...snackBar.error.mock.calls]
      .map(c => c[0]);
    expect(allCalls.join(' ')).not.toContain('requested');
  });

  // Unmap is synchronous server-side (results never come back PENDING), so
  // runBulkWithProgress skips the progress phase and goes straight to the
  // settled summary — one failure among two should read "1 route unmapped,
  // 1 failed", never the old "requested" wording.
  it('bulk unmap: one failure reports settled outcome via error()', async () => {
    const targets: StRoute[] = [
      route({ cnsiGuid: 'cnsi-1', guid: 'route-1', appGuids: ['app-1'] }),
      route({ cnsiGuid: 'cnsi-1', guid: 'route-2', appGuids: ['app-2'] }),
    ];
    stubRoutesConfig.view.filteredItems = signal(targets).asReadonly();
    stubRoutesConfig.bulkUnmapRoutes.mockResolvedValue({
      results: [
        { guid: 'route-1', state: 'COMPLETE' },
        { guid: 'route-2', state: 'FAILED' },
      ],
      succeeded: 1,
      failed: 1,
      pending: 0,
    });

    const cfg = component.listConfig();
    const unmapAction = cfg!.bulkActions!.find(a => a.label === 'Unmap');
    expect(unmapAction).toBeDefined();

    unmapAction!.run(new Set(['cnsi-1:route-1', 'cnsi-1:route-2']));
    await flush();

    expect(stubRoutesConfig.bulkUnmapRoutes).toHaveBeenCalledWith('cnsi-1', ['route-1', 'route-2']);
    expect(snackBar.error).toHaveBeenCalledWith('1 route unmapped, 1 failed');
    const allCalls = [...snackBar.open.mock.calls, ...snackBar.show.mock.calls, ...snackBar.error.mock.calls]
      .map(c => c[0]);
    expect(allCalls.join(' ')).not.toContain('requested');
  });
});
