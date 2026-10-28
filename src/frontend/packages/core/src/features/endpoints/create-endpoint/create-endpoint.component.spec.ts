import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { entityCatalog } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TabNavService, CurrentUserPermissionsService, SidePanelService } from '@stratosui/core';
import { AppTestModule } from '@test-framework/core-test.helper';

import { generateCoreStratosEntities } from '../../metrics/metrics-endpoint';
import { SteppersComponent } from '../../../shared/components/stepper/steppers/steppers.component';
import { ConnectEndpointComponent } from '../connect-endpoint/connect-endpoint.component';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog.service';
import { TailwindSnackBarService } from '../../../shared/services/tailwind-snackbar.service';
import { ENDPOINT_REGISTER_HANDLE } from '../endpoint-register-modal/endpoint-register-handle';
import { EndpointsSignalConfigService } from '../endpoints-page/endpoints-signal-config.service';
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

  it('labels the last button Close when not connecting', async () => {
    const label = () => component.connectStepHandle.finishButtonText!();
    expect(label()).toBe('Close');
    component['_connect'].set({ doConnectSignal: signal(true) } as never);
    expect(label()).toBe('Connect');
  });

  // Previous only moves: the endpoint stays registered and step 1 shows it locked.
  describe('Previous from the Connect step', () => {
    let unregister: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      vi.spyOn(TestBed.inject(ConfirmationDialogService), 'openWithCancel');
      unregister = vi.fn().mockResolvedValue({ error: false });
      vi.spyOn(TestBed.inject(EndpointsSignalConfigService), 'unregister').mockImplementation(unregister as never);
      component.step1 = {
        onNext: () => of({ success: true, data: { guid: 'new-guid', type: 'metrics', name: 'my-metrics' } }),
      } as unknown as CreateEndpointCfStep1Component;
      await component.step1StepHandle.submit!();
    });

    it('keeps the endpoint: no question, no unregister', async () => {
      expect(component.connectStepHandle.confirmPrevious).toBeUndefined();
      expect(component.connectStepHandle.onLeave).toBeUndefined();
      expect(TestBed.inject(ConfirmationDialogService).openWithCancel).not.toHaveBeenCalled();
      expect(unregister).not.toHaveBeenCalled();
    });

    it('labels Next on the reviewed Register step, and invalidates Connect once unregistered', async () => {
      expect(component.step1StepHandle.nextButtonText!()).toBe('Next');
      component.onUnregistered();
      expect(component.step1StepHandle.nextButtonText!()).toBe('Register');
    });
  });

  // The Connect step shows the error under the form; the stepper adds no
  // snackbar of its own.
  it('shows a failed connect once, inline', async () => {
    const error = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'error');
    component.step1 = {
      onNext: () => of({ success: true, data: { guid: 'new-guid', type: 'metrics', name: 'my-metrics' } }),
    } as unknown as CreateEndpointCfStep1Component;
    await component.step1StepHandle.submit!();
    component['step1Valid'].set(true);
    await fixture.whenStable();
    const steppers = fixture.debugElement.query(By.directive(SteppersComponent)).componentInstance as SteppersComponent;
    steppers.setActive(1);
    await fixture.whenStable();
    const connect = fixture.debugElement.query(By.directive(CreateEndpointConnectComponent))
      .componentInstance as CreateEndpointConnectComponent;
    connect.onEnter({ guid: 'new-guid', name: 'my-metrics', type: 'metrics', subType: '', ssoAllowed: false });
    const cs = connect.connectService()!;
    vi.spyOn(cs, 'submit').mockReturnValue(of({ success: false, errorMessage: 'Bad credentials' }));
    cs.connectingError$ = of('Bad credentials');
    cs.isBusy$ = of(false);
    connect.doConnect = true;
    await fixture.whenStable();

    steppers.goNext();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-dialog-error')?.textContent).toContain('Bad credentials');
    expect(error).not.toHaveBeenCalled();
    expect(registerHandle.close).not.toHaveBeenCalled();
  });

  // Back on step 1 after registering, the form shows the endpoint locked.
  describe('Previous from Connect shows step 1 locked', () => {
    it('leaves the registered endpoint in place and locked', async () => {
      const dialog = vi.spyOn(TestBed.inject(ConfirmationDialogService), 'openWithCancel');
      const config = TestBed.inject(EndpointsSignalConfigService);
      vi.spyOn(config, 'register').mockResolvedValue({ busy: false, error: false, message: '', guid: 'g1' } as never);
      const unregister = vi.spyOn(config, 'unregister');
      const real = fixture.debugElement.query(By.directive(CreateEndpointCfStep1Component))
        .componentInstance as CreateEndpointCfStep1Component;
      real.registerForm.controls.nameField.setValue('my-metrics');
      real.registerForm.controls.urlField.setValue('metrics.example.com');
      component.step1 = real;
      await component.step1StepHandle.submit!();
      const steppers = fixture.debugElement.query(By.directive(SteppersComponent)).componentInstance as SteppersComponent;
      steppers.setActive(1);
      await fixture.whenStable();
      await steppers.goPrevious();
      await fixture.whenStable();

      expect(steppers.currentIndex()).toBe(0);
      expect(real.review()).toBe(true);
      expect((fixture.nativeElement.querySelector('#name') as HTMLInputElement).disabled).toBe(true);
      expect(dialog).not.toHaveBeenCalled();
      expect(unregister).not.toHaveBeenCalled();
    });
  });
});
