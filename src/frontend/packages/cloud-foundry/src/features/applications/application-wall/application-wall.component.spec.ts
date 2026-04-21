import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { ApplicationWallComponent } from './application-wall.component';
import { CfAppsSignalConfigService } from '../../../shared/components/list/list-types/app/cf-apps-signal-config.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';

function makeStubSignalConfigService() {
  const pageIndex = signal(0);
  const pageSize = signal(20);
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
  return {
    initialize: vi.fn(),
    loadAll: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    deleteApp: vi.fn().mockResolvedValue(undefined),
    filter: filterSig,
    sort: sortSig,
    pageSize,
    pageIndex,
    view,
    orchestrator,
  };
}

describe('ApplicationWallComponent', () => {
  let component: ApplicationWallComponent;
  let fixture: ComponentFixture<ApplicationWallComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubSignalConfigService>;

  beforeEach(async () => {
    stubSignalConfig = makeStubSignalConfigService();
    // Stub CloudFoundryService so its observables emit and complete
    // synchronously. The real service pulls from a PaginationMonitor that
    // never emits in isolation, which makes ngOnInit's
    // firstValueFrom(connectedCFEndpoints$) hang / throw EmptyError.
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
        ApplicationWallComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        TabNavService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {}
            }
          }
        },
        { provide: CfAppsSignalConfigService, useValue: stubSignalConfig },
        { provide: CloudFoundryService, useValue: stubCloudFoundryService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationWallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('initializes the signal config service with connected CF guids on ngOnInit', async () => {
    // fixture.detectChanges() in beforeEach already ran ngOnInit once via
    // the Angular lifecycle. Reset the mock so the explicit call below is
    // what the assertions observe.
    stubSignalConfig.initialize.mockClear();
    await component.ngOnInit();
    expect(stubSignalConfig.initialize).toHaveBeenCalledTimes(1);
    // We just want to confirm the wiring fires and passes an array of guids.
    expect(Array.isArray(stubSignalConfig.initialize.mock.calls[0][0])).toBe(true);
  });

  it('builds a SignalListConfig after ngOnInit', async () => {
    await component.ngOnInit();
    expect(component.listConfig).toBeDefined();
    expect(component.listConfig!.columns.length).toBeGreaterThan(0);
    expect(component.listConfig!.getRowKey({
      cnsiGuid: 'cnsi-1',
      guid: 'app-1',
      name: 'test',
      state: 'STARTED',
      spaceGuid: 'sp',
      instances: 1,
      createdAt: '',
      updatedAt: '',
    } as any)).toBe('cnsi-1:app-1');
  });
});

describe('ApplicationWallComponent.countDuplicateUrlEndpoints', () => {
  const ep = (guid: string, host: string) => ({
    guid,
    name: guid,
    api_endpoint: { Scheme: 'https', Host: host, Path: '' },
  } as any);

  it('returns null for zero or one endpoint', () => {
    expect(ApplicationWallComponent.countDuplicateUrlEndpoints([])).toBeNull();
    expect(ApplicationWallComponent.countDuplicateUrlEndpoints([ep('a', 'cf.a')])).toBeNull();
  });

  it('returns null when all URLs are distinct', () => {
    expect(ApplicationWallComponent.countDuplicateUrlEndpoints([
      ep('a', 'cf-a.example.com'),
      ep('b', 'cf-b.example.com'),
    ])).toBeNull();
  });

  it('returns endpoint count in duplicate groups when URLs collide', () => {
    expect(ApplicationWallComponent.countDuplicateUrlEndpoints([
      ep('a', 'cf.example.com'),
      ep('b', 'cf.example.com'),
    ])).toBe(2);
  });

  it('counts only endpoints in duplicate groups, not distinct-URL endpoints', () => {
    expect(ApplicationWallComponent.countDuplicateUrlEndpoints([
      ep('a', 'cf.example.com'),
      ep('b', 'cf.example.com'),
      ep('c', 'cf-other.example.com'),
    ])).toBe(2);
  });

  it('sums across multiple duplicate groups', () => {
    expect(ApplicationWallComponent.countDuplicateUrlEndpoints([
      ep('a', 'cf.example.com'),
      ep('b', 'cf.example.com'),
      ep('c', 'cf-two.example.com'),
      ep('d', 'cf-two.example.com'),
      ep('e', 'cf-two.example.com'),
    ])).toBe(5);
  });
});
