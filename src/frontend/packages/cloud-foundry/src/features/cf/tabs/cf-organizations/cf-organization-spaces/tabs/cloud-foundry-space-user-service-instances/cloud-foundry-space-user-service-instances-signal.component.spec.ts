import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CurrentUserPermissionsService, TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { CloudFoundrySpaceUserServiceInstancesSignalComponent } from './cloud-foundry-space-user-service-instances-signal.component';
import {
  CfServiceInstancesSignalConfigService,
} from '../../../../../../../shared/signal-list-configs/service-instance/cf-service-instances-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';

function makeStubSignalConfigService() {
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
  return {
    initializeForSpace: vi.fn(),
    initialize: vi.fn(),
    loadAll: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    registerSortExtractor: vi.fn(),
    registerFilterExtractor: vi.fn(),
    deleteServiceInstance: vi.fn().mockResolvedValue(undefined),
    clearFilters: vi.fn(),
    filter: filterSig,
    sort: sortSig,
    pageSize,
    pageIndex,
    view,
    orchestrator,
    selectedCnsi: signal<string | null>(null),
    nameFilter: signal(''),
    filterField: signal('name'),
    viewMode: signal<'card' | 'table'>('card'),
  };
}

describe('CloudFoundrySpaceUserServiceInstancesSignalComponent', () => {
  let component: CloudFoundrySpaceUserServiceInstancesSignalComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceUserServiceInstancesSignalComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubSignalConfigService>;

  beforeEach(async () => {
    stubSignalConfig = makeStubSignalConfigService();
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundrySpaceUserServiceInstancesSignalComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        TabNavService,
        { provide: CfServiceInstancesSignalConfigService, useValue: stubSignalConfig },
        { provide: CurrentUserPermissionsService, useValue: { can: () => of(true) } },
        { provide: CloudFoundryEndpointService, useValue: { cfGuid: 'cnsi-1' } },
        { provide: CloudFoundryOrganizationService, useValue: { orgGuid: 'org-1', cfGuid: 'cnsi-1' } },
        { provide: CloudFoundrySpaceService, useValue: { spaceGuid: 'space-1', orgGuid: 'org-1', cfGuid: 'cnsi-1' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CloudFoundrySpaceUserServiceInstancesSignalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('initializes the signal config for this space, narrowed to user-provided', () => {
    expect(stubSignalConfig.initializeForSpace).toHaveBeenCalledWith('cnsi-1', 'space-1', 'user-provided');
  });

  it('builds a SignalListConfig with the per-space user-provided columns (no Service column)', () => {
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();
    expect(cfg!.columns.map(c => c.header)).toEqual([
      'Name', 'Last Operation', 'Tags', 'Created', '', '',
    ]);
    expect(cfg!.getRowKey({
      cnsiGuid: 'cnsi-1', guid: 'si-2', name: 'legacy-db', type: 'user-provided',
      tags: [], createdAt: '',
    } as any)).toBe('cnsi-1:si-2');
  });

  it('Name column links to the legacy /services/user-provided/:cnsi/:siGuid detail page', () => {
    const cfg = component.listConfig();
    const nameCol = cfg!.columns.find(c => c.key === 'name');
    expect(nameCol).toBeDefined();
    const link = nameCol!.link!({
      cnsiGuid: 'cnsi-1', guid: 'si-2', name: 'legacy-db', type: 'user-provided',
      tags: [], createdAt: '',
    } as any);
    expect(link).toEqual(['/services', 'user-provided', 'cnsi-1', 'si-2']);
  });

  it('Add UPS opens the user-provided wizard pre-selecting this CF', () => {
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    expect(component.createServiceInstanceAction.label).toBe('Add User Provided Service Instance');
    component.createServiceInstanceAction.invoke();
    expect(navSpy).toHaveBeenCalledWith(
      ['/services/new/user-service'],
      { queryParams: { 'auto-select-endpoint': 'cnsi-1' } },
    );
  });

  it('row actions are Edit / Detach / Delete', () => {
    const cfg = component.listConfig();
    const actionsCol: any = cfg!.columns.find(c => c.key === 'actions');
    const ups: any = { cnsiGuid: 'cnsi-1', guid: 'si-2', name: 'legacy-db', type: 'user-provided' };
    expect(actionsCol.actions(ups).map((a: any) => a.label)).toEqual(['Edit', 'Detach', 'Delete']);
  });

  it('omits CF/Org/Space dropdowns and toolbar Type/Service columns', () => {
    const cfg = component.listConfig();
    expect(cfg!.filterDropdowns).toBeUndefined();
    expect(cfg!.columns.find(c => c.key === 'type')).toBeUndefined();
    expect(cfg!.columns.find(c => c.key === 'cf')).toBeUndefined();
    expect(cfg!.columns.find(c => c.key === 'service')).toBeUndefined();
  });
});
