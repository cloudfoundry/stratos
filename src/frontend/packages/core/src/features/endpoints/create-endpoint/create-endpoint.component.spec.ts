import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { entityCatalog } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TabNavService, CurrentUserPermissionsService, SidePanelService } from '@stratosui/core';
import { AppTestModule } from '@test-framework/core-test.helper';

import { generateCoreStratosEntities } from '../../metrics/metrics-endpoint';
import { ConnectEndpointComponent } from '../connect-endpoint/connect-endpoint.component';
import { ENDPOINT_REGISTER_HANDLE } from '../endpoint-register-modal/endpoint-register-handle';
import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1/create-endpoint-cf-step-1.component';
import { CreateEndpointConnectComponent } from './create-endpoint-connect/create-endpoint-connect.component';
import { CreateEndpointComponent } from './create-endpoint.component';

describe('CreateEndpointComponent', () => {
  let component: CreateEndpointComponent;
  let fixture: ComponentFixture<CreateEndpointComponent>;
  let registerHandle: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    registerHandle = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        AppTestModule,
        CreateEndpointComponent,
        CreateEndpointCfStep1Component,
        CreateEndpointConnectComponent,
        ConnectEndpointComponent,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
              params: {
                type: 'metrics',
                subtype: null,
              }
            }
          },
        },
        // Rendered inside the Register Endpoint dialog
        { provide: ENDPOINT_REGISTER_HANDLE, useValue: registerHandle },
        CurrentUserPermissionsService,
        TabNavService,
        SidePanelService,
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    // Register entities AFTER modules are loaded, as the app does: the
    // core-completed set, so Metrics carries its auth types.
    const entities = generateCoreStratosEntities();
    entities.forEach(entity => entityCatalog.register(entity));
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(CreateEndpointComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // Metrics accepts a username/password or no login (jetstream metrics
  // plugin Connect), so registering it offers the same optional Connect
  // step as Cloud Foundry.
  it('offers the optional Connect step when registering Metrics', () => {
    expect(component.showConnectStep).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Connect (Optional)');
  });

  // Inside the Register Endpoint dialog the form closes the dialog through
  // its handle; navigating to /endpoints would reload the page under it.
  describe('in the Register Endpoint dialog', () => {
    it('closes the dialog on Cancel', async () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
      (fixture.nativeElement.querySelector('#stepper_cancel') as HTMLButtonElement).click();
      await fixture.whenStable();
      expect(registerHandle.close).toHaveBeenCalledWith(false);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('closes the dialog, reporting the registration, when Register finishes the form', async () => {
      component.step1 = {
        onNext: () => of({ success: true, redirect: true }),
      } as unknown as CreateEndpointCfStep1Component;
      await component.step1StepHandle.submit!();
      expect(registerHandle.close).toHaveBeenCalledWith(true);
    });
  });
});
