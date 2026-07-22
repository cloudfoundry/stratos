import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { generateCfBaseTestModulesNoShared } from "@test-framework/cf";
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { AppDetailDataService } from '../../../../features/applications/app-detail-data.service';
import { CloudFoundryUserProvidedServicesService } from '../../../services/cloud-foundry-user-provided-services.service';
import { CsiModeService } from '../csi-mode.service';
import { CsiStateService } from '../csi-state.service';
import { SpecifyUserProvidedDetailsComponent } from "./specify-user-provided-details.component";

describe('SpecifyUserProvidedDetailsComponent', () => {
  let component: SpecifyUserProvidedDetailsComponent;
  let fixture: ComponentFixture<SpecifyUserProvidedDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SpecifyUserProvidedDetailsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          generateCfBaseTestModulesNoShared(),
        ),
        CsiModeService,
        CsiStateService,
        CloudFoundryUserProvidedServicesService,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SpecifyUserProvidedDetailsComponent);
    component = fixture.componentInstance;

    // Set required inputs
    component.cfGuid = 'test-cf-guid';
    component.spaceGuid = 'test-space-guid';
    component.appId = 'test-app-id';

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// Stage 4 of the services-domain signal+V3 slice: onNextUpdate replaces the
// old ngrx Store dispatch (AppServiceBindingDataSource.createGetAllServiceBindings)
// with a v3-native AppDetailDataService.refresh('serviceBindings'). The service
// is per-app-detail-route scoped, so the component injects it as optional —
// outside the app-detail hierarchy the refresh is a no-op (no in-context
// bindings view to update).
describe('SpecifyUserProvidedDetailsComponent.onNextUpdate', () => {
  function setupComponent(opts: {
    updateResult: { success: boolean; message?: string };
    withAppDetailData?: boolean;
  }) {
    const upsServiceStub = {
      updateUserProvidedService: vi.fn().mockReturnValue(of(opts.updateResult)),
      // No-op stubs for fields the constructor / template touches.
      getUserProvidedServices: vi.fn().mockReturnValue(of([])),
      getUserProvidedService: vi.fn().mockReturnValue(of({})),
    };
    const refreshSpy = vi.fn().mockResolvedValue(undefined);
    const appDetailDataStub = { refresh: refreshSpy };

    const providers: any[] = [
      provideZonelessChangeDetection(),
      provideRouter([]),
      provideHttpClient(),
      ...STORE_TEST_PROVIDERS,
      importProvidersFrom(generateCfBaseTestModulesNoShared()),
      CsiModeService,
      CsiStateService,
      { provide: CloudFoundryUserProvidedServicesService, useValue: upsServiceStub },
    ];
    if (opts.withAppDetailData ?? true) {
      providers.push({ provide: AppDetailDataService, useValue: appDetailDataStub });
    }

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SpecifyUserProvidedDetailsComponent],
      providers,
    });

    const fixture = TestBed.createComponent(SpecifyUserProvidedDetailsComponent);
    const component = fixture.componentInstance;
    component.cfGuid = 'cf-1';
    component.spaceGuid = 'space-1';
    component.appId = 'app-1';
    component.serviceInstanceId = 'si-1';
    component.isUpdate = true;
    return { fixture, component, upsServiceStub, refreshSpy };
  }

  it('refreshes app bindings on successful update when AppDetailDataService is available', async () => {
    const { component, upsServiceStub, refreshSpy } = setupComponent({
      updateResult: { success: true },
    });

    const result = await firstValueFrom(component.onNext());

    expect(upsServiceStub.updateUserProvidedService).toHaveBeenCalledWith(
      'cf-1', 'si-1', expect.any(Object),
    );
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledWith('serviceBindings');
    expect(result).toEqual({ success: true, redirect: true });
  });

  it('still returns success when AppDetailDataService is absent (services-wall edit path)', async () => {
    const { component, upsServiceStub } = setupComponent({
      updateResult: { success: true },
      withAppDetailData: false,
    });

    const result = await firstValueFrom(component.onNext());

    expect(upsServiceStub.updateUserProvidedService).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, redirect: true });
  });

  it('returns error message and does not refresh when update fails', async () => {
    const { component, refreshSpy } = setupComponent({
      updateResult: { success: false, message: 'broker rejected the update' },
    });

    const result = await firstValueFrom(component.onNext());

    expect(refreshSpy).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      redirect: false,
      message: 'Failed to update service instance: broker rejected the update',
    });
  });
});
