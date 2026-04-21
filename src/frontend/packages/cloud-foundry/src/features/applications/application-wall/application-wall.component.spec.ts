import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { ApplicationWallComponent } from './application-wall.component';
import { CfAppsSignalConfigService } from '../../../shared/components/list/list-types/app/cf-apps-signal-config.service';

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
    await component.ngOnInit();
    expect(stubSignalConfig.initialize).toHaveBeenCalledTimes(1);
    // The STORE_TEST_PROVIDERS ship an empty endpoint set by default, so the
    // guid list resolves to []. We just want to confirm the wiring fires.
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
