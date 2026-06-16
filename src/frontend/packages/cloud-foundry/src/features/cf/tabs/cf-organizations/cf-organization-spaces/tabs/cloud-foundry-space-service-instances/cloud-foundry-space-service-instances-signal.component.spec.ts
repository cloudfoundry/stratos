import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CurrentUserPermissionsService, TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { CloudFoundrySpaceServiceInstancesSignalComponent } from './cloud-foundry-space-service-instances-signal.component';
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
    isOfferingBindable: vi.fn().mockReturnValue(undefined),
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

describe('CloudFoundrySpaceServiceInstancesSignalComponent', () => {
  let component: CloudFoundrySpaceServiceInstancesSignalComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceServiceInstancesSignalComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubSignalConfigService>;

  beforeEach(async () => {
    stubSignalConfig = makeStubSignalConfigService();
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundrySpaceServiceInstancesSignalComponent,
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

    fixture = TestBed.createComponent(CloudFoundrySpaceServiceInstancesSignalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('initializes the signal config for this space, narrowed to managed', () => {
    expect(stubSignalConfig.initializeForSpace).toHaveBeenCalledWith('cnsi-1', 'space-1', 'managed');
  });

  it('builds a SignalListConfig with the per-space managed columns', () => {
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();
    expect(cfg!.columns.map(c => c.header)).toEqual([
      'Name', 'Service', 'Last Operation', 'Attached Apps', 'Tags', 'Created', '', '',
    ]);
    expect(cfg!.getRowKey({
      cnsiGuid: 'cnsi-1', guid: 'si-1', name: 'cache', type: 'managed',
      tags: [], createdAt: '',
    } as any)).toBe('cnsi-1:si-1');
  });

  it('Service column renders the offering name (managed only on this page)', () => {
    const cfg = component.listConfig();
    const serviceCol = cfg!.columns.find(c => c.key === 'service');
    expect(serviceCol).toBeDefined();
    const managed: any = {
      cnsiGuid: 'cnsi-1', guid: 'si-1', name: 'cache', type: 'managed',
      servicePlan: { guid: 'plan-1', serviceOffering: { guid: 'off-1', name: 'redis' } },
      tags: [], createdAt: '',
    };
    expect(serviceCol!.render!(managed)).toBe('redis');
  });

  it('Name column links to the legacy /services/managed/:cnsi/:siGuid detail page', () => {
    const cfg = component.listConfig();
    const nameCol = cfg!.columns.find(c => c.key === 'name');
    expect(nameCol).toBeDefined();
    const link = nameCol!.link!({
      cnsiGuid: 'cnsi-1', guid: 'si-1', name: 'cache', type: 'managed',
      tags: [], createdAt: '',
    } as any);
    expect(link).toEqual(['/services', 'managed', 'cnsi-1', 'si-1']);
  });

  it('Add Service Instance opens the managed wizard pre-selecting this CF', () => {
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    expect(component.createServiceInstanceAction.label).toBe('Add Service Instance');
    component.createServiceInstanceAction.invoke();
    expect(navSpy).toHaveBeenCalledWith(
      ['/services/new/service'],
      { queryParams: { 'auto-select-endpoint': 'cnsi-1' } },
    );
  });

  it('row actions are Edit / Detach / Service Keys / Delete (managed, bindable)', () => {
    const cfg = component.listConfig();
    const actionsCol: any = cfg!.columns.find(c => c.key === 'actions');
    // Managed + isOfferingBindable undefined (cold) → fail open → Service Keys shown.
    const managed: any = { cnsiGuid: 'cnsi-1', guid: 'si-1', name: 'cache', type: 'managed' };
    expect(actionsCol.actions(managed).map((a: any) => a.label)).toEqual(['Edit', 'Detach', 'Service Keys', 'Delete']);
  });

  it('omits CF/Org/Space dropdowns and toolbar Type column', () => {
    const cfg = component.listConfig();
    expect(cfg!.filterDropdowns).toBeUndefined();
    expect(cfg!.columns.find(c => c.key === 'type')).toBeUndefined();
    expect(cfg!.columns.find(c => c.key === 'cf')).toBeUndefined();
  });
});
