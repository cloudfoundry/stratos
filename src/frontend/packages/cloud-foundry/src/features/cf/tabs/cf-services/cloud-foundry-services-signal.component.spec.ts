import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CurrentUserPermissionsService, TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { CloudFoundryServicesSignalComponent } from './cloud-foundry-services-signal.component';
import {
  CfServiceInstancesSignalConfigService,
} from '../../../../shared/signal-list-configs/service-instance/cf-service-instances-signal-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

function makeStubSignalConfigService() {
  return {
    initialize: vi.fn(),
    loadAll: vi.fn().mockResolvedValue(undefined),
    startProgressPolling: vi.fn(),
    refresh: vi.fn().mockResolvedValue(undefined),
    registerSortExtractor: vi.fn(),
    registerFilterExtractor: vi.fn(),
    deleteServiceInstance: vi.fn().mockResolvedValue(undefined),
    isOfferingBindable: vi.fn().mockReturnValue(undefined),
    serviceKeyCount: vi.fn().mockReturnValue(undefined),
    ensureServiceKeyCounts: vi.fn(),
    clearFilters: vi.fn(),
    sort: signal({ field: 'name' as const, direction: 'asc' as const }),
    pageSize: signal(6),
    pageIndex: signal(0),
    view: {
      pagedItems: signal([]).asReadonly(),
      totalFilteredResults: signal(0).asReadonly(),
      totalPages: signal(1).asReadonly(),
      totalItems: signal(0).asReadonly(),
    },
    orchestrator: {
      isAnyLoading: signal(false).asReadonly(),
      errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
    },
    selectedCnsi: signal<string | null>(null),
    orgOptions: signal([]).asReadonly(),
    selectedOrg: signal<string | null>(null),
    isLoadingOrgs: signal(false).asReadonly(),
    spaceOptions: signal([]).asReadonly(),
    selectedSpace: signal<string | null>(null),
    isLoadingSpaces: signal(false).asReadonly(),
    nameFilter: signal(''),
    filterField: signal('name'),
    viewMode: signal<'card' | 'table'>('card'),
  };
}

describe('CloudFoundryServicesSignalComponent', () => {
  let component: CloudFoundryServicesSignalComponent;
  let fixture: ComponentFixture<CloudFoundryServicesSignalComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubSignalConfigService>;

  beforeEach(async () => {
    stubSignalConfig = makeStubSignalConfigService();
    await TestBed.configureTestingModule({
      imports: [CloudFoundryServicesSignalComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        TabNavService,
        { provide: CfServiceInstancesSignalConfigService, useValue: stubSignalConfig },
        { provide: CurrentUserPermissionsService, useValue: { can: () => of(true) } },
        { provide: CloudFoundryEndpointService, useValue: { cfGuid: 'cnsi-1' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CloudFoundryServicesSignalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // The tab uses the Last Operation column every service-instance list shares.
  it('Last Operation names the operation', () => {
    const cfg = component.listConfig()!;
    expect(cfg.columns.map(c => c.header)).toContain('Last Operation');
    const col = cfg.columns.find(c => c.key === 'lastOp')!;
    const si: any = { lastOperation: { type: 'update', state: 'failed', description: '<b>quota</b> exceeded' } };
    expect(col.render(si)).toBe('Update failed');
    expect(col.tooltip!(si)).toBe('Update failed — quota exceeded');
    const sortBy = stubSignalConfig.registerSortExtractor.mock.calls.find((c: unknown[]) => c[0] === 'lastOp')![1];
    expect(sortBy(si)).toBe('Update failed');
  });

  // The progress poll must end with this page, not run on in the root config.
  it('polls operations in progress only while this page is open', () => {
    const host = stubSignalConfig.startProgressPolling.mock.calls.at(-1)?.[0] as { destroyed: boolean } | undefined;
    expect(host?.destroyed).toBe(false);

    fixture.destroy();
    expect(host?.destroyed).toBe(true);
  });
});
