import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { ServicesWallComponent } from './services-wall.component';
import {
  CfServiceInstancesSignalConfigService,
} from '../../../shared/signal-list-configs/service-instance/cf-service-instances-signal-config.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';

function makeStubSignalConfigService() {
  const pageIndex = signal(0);
  const pageSize = signal(6);
  const filterSig = signal(() => true);
  const sortSig = signal({ field: 'name' as const, direction: 'asc' as const });
  const view = {
    pagedItems: signal([]).asReadonly(),
    totalFilteredResults: signal(0).asReadonly(),
    totalPages: signal(1).asReadonly(),
  };
  const orchestrator = {
    isAnyLoading: signal(false).asReadonly(),
    errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
  };
  const allOption = { label: 'All', value: null };
  return {
    initialize: vi.fn(),
    loadAll: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    registerSortExtractor: vi.fn(),
    registerFilterExtractor: vi.fn(),
    deleteServiceInstance: vi.fn().mockResolvedValue(undefined),
    isOfferingBindable: vi.fn().mockReturnValue(undefined),
    serviceKeyCount: vi.fn().mockReturnValue(undefined),
    ensureServiceKeyCounts: vi.fn(),
    filter: filterSig,
    sort: sortSig,
    pageSize,
    pageIndex,
    view,
    orchestrator,
    selectedCnsi: signal<string | null>(null),
    selectedOrg: signal<string | null>(null),
    selectedSpace: signal<string | null>(null),
    nameFilter: signal(''),
    filterField: signal('name'),
    viewMode: signal<'card' | 'table'>('card'),
    cnsiOptions: signal([allOption]).asReadonly(),
    orgOptions: signal([allOption]).asReadonly(),
    spaceOptions: signal([allOption]).asReadonly(),
    endpointNames: signal(new Map<string, string>([['cnsi-1', 'CF 1']])).asReadonly(),
  };
}

describe('ServicesWallComponent', () => {
  let component: ServicesWallComponent;
  let fixture: ComponentFixture<ServicesWallComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubSignalConfigService>;

  beforeEach(async () => {
    stubSignalConfig = makeStubSignalConfigService();
    const endpoints: any[] = [
      {
        guid: 'cnsi-1',
        name: 'CF 1',
        cnsi_type: 'cf',
        connectionStatus: 'connected',
        api_endpoint: { Scheme: 'https', Host: 'cf-1.example.com', Path: '' },
      },
    ];
    const stubCloudFoundryService = {
      cFEndpoints$: of(endpoints),
      connectedCFEndpoints$: of(endpoints),
      hasConnectedCFEndpoints$: of(true),
      hasRegisteredCFEndpoints$: of(true),
    };
    await TestBed.configureTestingModule({
      imports: [
        ServicesWallComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        TabNavService,
        { provide: CfServiceInstancesSignalConfigService, useValue: stubSignalConfig },
        { provide: CloudFoundryService, useValue: stubCloudFoundryService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServicesWallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('initializes the signal config service with connected CF guids on ngOnInit', async () => {
    stubSignalConfig.initialize.mockClear();
    await component.ngOnInit();
    expect(stubSignalConfig.initialize).toHaveBeenCalledTimes(1);
    expect(Array.isArray(stubSignalConfig.initialize.mock.calls[0][0])).toBe(true);
  });

  it('builds a SignalListConfig with the services-wall columns after ngOnInit', async () => {
    await component.ngOnInit();
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();
    expect(cfg!.columns.map(c => c.header)).toEqual([
      'Name', 'Service', 'Last Operation', 'Attached Apps', 'Service Keys', 'Tags', 'Created', 'Type', 'CF', '', '',
    ]);
    expect(cfg!.getRowKey({
      cnsiGuid: 'cnsi-1', guid: 'si-1', name: 'redis', type: 'managed',
      tags: [], createdAt: '',
    } as any)).toBe('cnsi-1:si-1');
  });

  it('Service Keys column links to the keys page, renders the lazy count, and triggers the fetch', async () => {
    await component.ngOnInit();
    await Promise.resolve();
    const col: any = component.listConfig()!.columns.find(c => c.key === 'serviceKeys');
    expect(col.kind).toBe('link');
    const si: any = { cnsiGuid: 'cnsi-1', guid: 'si-1', name: 'redis', type: 'managed' };
    expect(col.link(si)).toEqual(['/services', 'service', 'cnsi-1', 'si-1', 'keys']);
    expect(col.render(si)).toBe('—');
    expect(stubSignalConfig.ensureServiceKeyCounts).toHaveBeenCalled();
  });

  it('renders Service column from offering name for managed and label for user-provided', async () => {
    await component.ngOnInit();
    const cfg = component.listConfig();
    const serviceCol = cfg!.columns.find(c => c.key === 'service');
    expect(serviceCol).toBeDefined();
    const managed: any = {
      cnsiGuid: 'cnsi-1', guid: 'si-1', name: 'cache', type: 'managed',
      servicePlan: { guid: 'plan-1', serviceOffering: { guid: 'off-1', name: 'redis' } },
      tags: [], createdAt: '',
    };
    const ups: any = {
      cnsiGuid: 'cnsi-1', guid: 'si-2', name: 'legacy-db', type: 'user-provided',
      tags: [], createdAt: '',
    };
    expect(serviceCol!.render!(managed)).toBe('redis');
    expect(serviceCol!.render!(ups)).toBe('User Provided');
  });

  it('row actions: managed gets Service Keys (bindable), user-provided does not', async () => {
    await component.ngOnInit();
    const cfg = component.listConfig();
    const actionsCol = cfg!.columns.find(c => c.key === 'actions');
    expect(actionsCol).toBeDefined();
    // isOfferingBindable returns undefined here (cache cold) → fail open, so a
    // managed instance shows Service Keys; user-provided never does.
    const managed: any = { cnsiGuid: 'cnsi-1', guid: 'si-1', name: 'cache', type: 'managed' };
    expect((actionsCol as any).actions!(managed).map((a: any) => a.label))
      .toEqual(['Edit', 'Detach', 'Service Keys', 'Delete']);
    const ups: any = { cnsiGuid: 'cnsi-1', guid: 'si-2', name: 'legacy-db', type: 'user-provided' };
    expect((actionsCol as any).actions!(ups).map((a: any) => a.label))
      .toEqual(['Edit', 'Detach', 'Delete']);
  });

  it('Edit / Detach navigate with :type = service for managed, user-service for user-provided', async () => {
    await component.ngOnInit();
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const cfg = component.listConfig();
    const actionsCol: any = cfg!.columns.find(c => c.key === 'actions');

    const managed: any = { cnsiGuid: 'cnsi-1', guid: 'si-1', name: 'cache', type: 'managed' };
    const managedActions = actionsCol.actions(managed);
    managedActions.find((a: any) => a.label === 'Edit').invoke();
    managedActions.find((a: any) => a.label === 'Detach').invoke();
    expect(navSpy).toHaveBeenCalledWith(['/services', 'service', 'cnsi-1', 'si-1', 'edit']);
    expect(navSpy).toHaveBeenCalledWith(['/services', 'service', 'cnsi-1', 'si-1', 'detach']);

    const ups: any = { cnsiGuid: 'cnsi-1', guid: 'si-2', name: 'legacy-db', type: 'user-provided' };
    const upsActions = actionsCol.actions(ups);
    upsActions.find((a: any) => a.label === 'Edit').invoke();
    upsActions.find((a: any) => a.label === 'Detach').invoke();
    expect(navSpy).toHaveBeenCalledWith(['/services', 'user-service', 'cnsi-1', 'si-2', 'edit']);
    expect(navSpy).toHaveBeenCalledWith(['/services', 'user-service', 'cnsi-1', 'si-2', 'detach']);
  });

  it('wires the CF / Organization / Space filter dropdowns into listConfig', async () => {
    await component.ngOnInit();
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();
    expect(cfg!.nameFilter).toBe(stubSignalConfig.nameFilter);
    expect(cfg!.filterDropdowns).toBeDefined();
    expect(cfg!.filterDropdowns!.map(d => d.label)).toEqual(['Cloud Foundry', 'Organization', 'Space']);
    expect(cfg!.filterDropdowns![0].selected).toBe(stubSignalConfig.selectedCnsi);
    expect(cfg!.filterDropdowns![1].selected).toBe(stubSignalConfig.selectedOrg);
    expect(cfg!.filterDropdowns![2].selected).toBe(stubSignalConfig.selectedSpace);
  });
});
