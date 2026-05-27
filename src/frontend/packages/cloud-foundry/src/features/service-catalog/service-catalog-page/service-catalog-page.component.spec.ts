import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { ServiceCatalogPageComponent } from './service-catalog-page.component';
import {
  CfServiceOfferingsSignalConfigService,
} from '../../../shared/components/list/list-types/service-offering/cf-service-offerings-signal-config.service';
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
    endpointNames: signal(new Map<string, string>()).asReadonly(),
  };
}

describe('ServiceCatalogPageComponent', () => {
  let component: ServiceCatalogPageComponent;
  let fixture: ComponentFixture<ServiceCatalogPageComponent>;
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
        ServiceCatalogPageComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        TabNavService,
        { provide: CfServiceOfferingsSignalConfigService, useValue: stubSignalConfig },
        { provide: CloudFoundryService, useValue: stubCloudFoundryService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCatalogPageComponent);
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

  it('builds a SignalListConfig with the marketplace columns after ngOnInit', async () => {
    await component.ngOnInit();
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();
    expect(cfg!.columns.map(c => c.header)).toEqual([
      'Name', 'Description', 'Broker', 'Tags', 'CF', '', '',
    ]);
    expect(cfg!.getRowKey({
      cnsiGuid: 'cnsi-1', guid: 'svc-1', name: 'redis', description: '', brokerName: '',
      tags: [], public: true, createdAt: '', updatedAt: '',
    } as any)).toBe('cnsi-1:svc-1');
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
