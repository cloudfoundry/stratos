import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { ServicesWallComponent } from './services-wall.component';
import {
  CfServiceInstancesSignalConfigService,
} from '../../../shared/components/list/list-types/service-instance/cf-service-instances-signal-config.service';
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
    cnsiOptions: signal([allOption]).asReadonly(),
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
      'Name', 'Service', 'Last Operation', 'Tags', 'Created', 'Type', 'CF', '', '',
    ]);
    expect(cfg!.getRowKey({
      cnsiGuid: 'cnsi-1', guid: 'si-1', name: 'redis', type: 'managed',
      tags: [], createdAt: '',
    } as any)).toBe('cnsi-1:si-1');
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

  it('wires the CF filter dropdown into listConfig (no Org/Space)', async () => {
    await component.ngOnInit();
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();
    expect(cfg!.nameFilter).toBe(stubSignalConfig.nameFilter);
    expect(cfg!.filterDropdowns).toBeDefined();
    expect(cfg!.filterDropdowns!.map(d => d.label)).toEqual(['Cloud Foundry']);
    expect(cfg!.filterDropdowns![0].selected).toBe(stubSignalConfig.selectedCnsi);
  });
});
