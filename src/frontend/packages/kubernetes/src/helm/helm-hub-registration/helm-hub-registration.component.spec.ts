import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { EndpointsService } from '../../../../core/src/core/endpoints.service';
import { UserService } from '../../../../core/src/core/user.service';
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

  beforeEach(async () => {
    stubSignalConfig = makeStubEndpointsSignalConfig();
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
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmHubRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
