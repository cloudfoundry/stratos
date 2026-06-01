import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import {
  generateTestApplicationServiceProvider,
  ApplicationStateService,
  ApplicationEnvVarsHelper,
  generateCfBaseTestModulesNoShared,
} from '@test-framework/cf';

import { ApplicationDeleteComponent } from './application-delete.component';
import { AppDeleteSelectionService } from '../app-delete-selection.service';
import { AppDetailDataService } from '../app-detail-data.service';
import { CfAppsSignalConfigService } from '../../../shared/signal-list-configs/app/cf-apps-signal-config.service';

function makeStubAppDetailDataService() {
  const _errors = signal<Record<string, unknown | null>>({
    app: null, summary: null, stats: null, envVars: null,
    space: null, org: null, domains: null, routes: null, serviceBindings: null,
  });
  const _loading = signal<Record<string, boolean>>({
    app: false, summary: false, stats: false, envVars: false,
    space: false, org: false, domains: false, routes: false, serviceBindings: false,
  });
  return {
    errors: _errors.asReadonly(),
    loading: _loading.asReadonly(),
    app: signal(undefined).asReadonly(),
    summary: signal(undefined).asReadonly(),
    stats: signal([]).asReadonly(),
    envVars: signal(undefined).asReadonly(),
    space: signal(undefined).asReadonly(),
    org: signal(undefined).asReadonly(),
    domains: signal([]).asReadonly(),
    routes: signal(null).asReadonly(),
    serviceBindings: signal(null).asReadonly(),
    refresh: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  };
}

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
    deleteRoute: vi.fn().mockResolvedValue(undefined),
    deleteServiceBinding: vi.fn().mockResolvedValue(undefined),
    fetchAppRoutes: vi.fn().mockResolvedValue([]),
    fetchAppServiceBindings: vi.fn().mockResolvedValue([]),
    filter: filterSig,
    sort: sortSig,
    pageSize,
    pageIndex,
    view,
    orchestrator,
  };
}

describe('ApplicationDeleteComponent', () => {
  let component: ApplicationDeleteComponent;
  let fixture: ComponentFixture<ApplicationDeleteComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubSignalConfigService>;
  let selection: AppDeleteSelectionService;
  const appId = '1';
  const cfId = '2';

  beforeEach(async () => {
    stubSignalConfig = makeStubSignalConfigService();
    await TestBed.configureTestingModule({
      imports: [
        ApplicationDeleteComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        generateTestApplicationServiceProvider(appId, cfId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        TabNavService,
        DatePipe,
        { provide: CfAppsSignalConfigService, useValue: stubSignalConfig },
        { provide: AppDetailDataService, useValue: makeStubAppDetailDataService() },
        AppDeleteSelectionService,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationDeleteComponent);
    component = fixture.componentInstance;
    selection = TestBed.inject(AppDeleteSelectionService);
    // Replace the real router's navigate with a stub so the confirm-step
    // submit doesn't blow up on the empty router config we provided. The
    // tests exercise the selection-stash side effect, not navigation.
    const router = TestBed.inject(Router);
    (router as any).navigate = vi.fn().mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('confirm step submit stashes selections in AppDeleteSelectionService', async () => {
    component.selectedRoutes = [{ guid: 'r-1' } as any, { guid: 'r-2' } as any];
    component.selectedServiceBindings = [{ guid: 'b-1' } as any];
    await component.confirmStepHandle.submit?.();
    expect(selection.requested()).toBe(true);
    expect(selection.routes()).toEqual([{ guid: 'r-1' }, { guid: 'r-2' }]);
    expect(selection.bindings()).toEqual([{ guid: 'b-1' }]);
  });

  it('confirm step submit stashes empty arrays when nothing was selected', async () => {
    component.selectedRoutes = [];
    component.selectedServiceBindings = [];
    await component.confirmStepHandle.submit?.();
    expect(selection.requested()).toBe(true);
    expect(selection.routes()).toEqual([]);
    expect(selection.bindings()).toEqual([]);
  });

  it('confirm step submit does NOT call deleteApp directly (the app page does)', async () => {
    component.selectedRoutes = [];
    component.selectedServiceBindings = [];
    await component.confirmStepHandle.submit?.();
    expect(stubSignalConfig.deleteApp).not.toHaveBeenCalled();
    expect(stubSignalConfig.deleteRoute).not.toHaveBeenCalled();
    expect(stubSignalConfig.deleteServiceBinding).not.toHaveBeenCalled();
  });
});
