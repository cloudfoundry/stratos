import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { EndpointsService } from '../../../../core/src/core/endpoints.service';
import { UserService } from '../../../../core/src/core/user.service';
import { ENDPOINT_REGISTER_HANDLE } from '../../../../core/src/features/endpoints/endpoint-register-modal/endpoint-register-handle';
import { EndpointsSignalConfigService } from '../../../../core/src/features/endpoints/endpoints-page/endpoints-signal-config.service';
import { BaseTestModules } from '../../../../core/test-framework/core-test.helper';
import { HelmReleaseActivatedRouteMock } from '../helm-testing.module';
import { HelmHubRegistrationComponent } from './helm-hub-registration.component';

function makeStubEndpointsSignalConfig() {
  return {
    // Only the register method is touched by helm-hub-registration; the rest
    // of the service's signal/computed surface is not read by this component.
    register: vi.fn().mockResolvedValue({ busy: false, error: false, message: 'new-endpoint-guid' }),
    unregister: vi.fn().mockResolvedValue({ busy: false, error: false, message: '' }),
  };
}

describe('HelmHubRegistrationComponent', () => {
  let component: HelmHubRegistrationComponent;
  let fixture: ComponentFixture<HelmHubRegistrationComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubEndpointsSignalConfig>;
  let registerHandle: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    stubSignalConfig = makeStubEndpointsSignalConfig();
    registerHandle = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules,
        HelmHubRegistrationComponent,
      ],
      providers: [
        EndpointsService,
        UserService,
        HelmReleaseActivatedRouteMock,
        { provide: EndpointsSignalConfigService, useValue: stubSignalConfig },
        // Rendered inside the Register Endpoint dialog
        { provide: ENDPOINT_REGISTER_HANDLE, useValue: registerHandle },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(HelmHubRegistrationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Inside the Register Endpoint dialog the form closes the dialog through
  // its handle instead of navigating to the page under it.
  it('closes the dialog, reporting the registration, once registered', async () => {
    await component.registerStepHandle.submit!();
    expect(registerHandle.close).toHaveBeenCalledWith(true);
  });

  it('closes the dialog on Cancel', async () => {
    (fixture.nativeElement.querySelector('#stepper_cancel') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(registerHandle.close).toHaveBeenCalledWith(false);
  });
});
