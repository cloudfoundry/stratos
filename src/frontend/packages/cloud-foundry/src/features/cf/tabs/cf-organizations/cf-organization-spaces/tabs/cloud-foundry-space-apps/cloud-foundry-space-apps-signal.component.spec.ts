import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CurrentUserPermissionsService, TabNavService } from '@stratosui/core';
import { of } from 'rxjs';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { CloudFoundrySpaceAppsSignalComponent } from './cloud-foundry-space-apps-signal.component';
import { CfAppsSignalConfigService } from '../../../../../../../shared/signal-list-configs/app/cf-apps-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';

function makeStubAppsConfig() {
  const pageIndex = signal(0);
  const pageSize = signal(6);
  const filterSig = signal(() => true);
  const sortSig = signal({ field: 'name' as const, direction: 'asc' as const });
  const view = {
    pagedItems: signal([]).asReadonly(),
    totalFilteredResults: signal(0).asReadonly(),
    totalPages: signal(1).asReadonly(),
    totalItems: signal(0).asReadonly(),
  };
  const orchestrator = {
    isAnyLoading: signal(false).asReadonly(),
    errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
  };
  const stats = signal(new Map<string, { running: number; total: number }>());
  return {
    initialize: vi.fn(),
    initializeForSpace: vi.fn(),
    clearLockedSpace: vi.fn(),
    loadAll: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    deleteApp: vi.fn().mockResolvedValue(undefined),
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
  };
}

describe('CloudFoundrySpaceAppsSignalComponent', () => {
  let component: CloudFoundrySpaceAppsSignalComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceAppsSignalComponent>;
  let stubAppsConfig: ReturnType<typeof makeStubAppsConfig>;

  beforeEach(async () => {
    stubAppsConfig = makeStubAppsConfig();
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
      'Name', 'Status', 'Instances', 'Memory', 'Disk', 'Created', '', '',
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

  it('formatMb returns human-friendly units and ∞ for unlimited', () => {
    expect(CloudFoundrySpaceAppsSignalComponent.formatMb(512)).toBe('512 MB');
    expect(CloudFoundrySpaceAppsSignalComponent.formatMb(2048)).toBe('2.0 GB');
    expect(CloudFoundrySpaceAppsSignalComponent.formatMb(-1)).toBe('∞');
    expect(CloudFoundrySpaceAppsSignalComponent.formatMb(undefined)).toBe('—');
  });
});
