import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { take } from 'rxjs/operators';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import {
  generateTestApplicationServiceProvider,
  ApplicationStateService,
  ApplicationEnvVarsHelper,
  generateCfBaseTestModulesNoShared,
} from '@test-framework/cf';

import { ApplicationDeleteComponent } from './application-delete.component';
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
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('invokes CfAppsSignalConfigService.deleteApp on startDelete', async () => {
    const result$ = component.startDelete();
    const result = await new Promise<{ success: boolean }>((resolve, reject) => {
      (result$ as any).pipe(take(1)).subscribe({
        next: (r: { success: boolean }) => resolve(r),
        error: reject,
      });
    });
    expect(stubSignalConfig.deleteApp).toHaveBeenCalledTimes(1);
    expect(stubSignalConfig.deleteApp).toHaveBeenCalledWith(cfId, appId);
    expect(result).toEqual({ success: true });
  });
});
