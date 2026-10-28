import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService, gitEntityCatalog } from '@stratosui/git';
import { createBasicStoreModule } from '../../../../../store/testing/src/store-test-helper';
import { EntityCatalogHelper, EntityCatalogHelpers, EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateStratosEntities } from '../../../../../store/src/stratos-entity-generator';
import { ConfirmationDialogService } from '../../../../../core/src/shared/components/confirmation-dialog.service';
import { ENDPOINT_REGISTER_HANDLE } from '../../../../../core/src/features/endpoints/endpoint-register-modal/endpoint-register-handle';
import { EndpointsSignalConfigService } from '../../../../../core/src/features/endpoints/endpoints-page/endpoints-signal-config.service';
import { CreateEndpointConnectComponent } from '../../../../../core/src/features/endpoints/create-endpoint/create-endpoint-connect/create-endpoint-connect.component';
import { SteppersComponent } from '../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { TailwindSnackBarService } from '../../../../../core/src/shared/services/tailwind-snackbar.service';
import { GitRegistrationComponent } from './git-registration.component';

function makeStubEndpointsSignalConfig() {
  return {
    // Only the methods git-registration touches need stubs; the rest of the
    // service's signal/computed surface is not read by this component.
    register: vi.fn().mockResolvedValue({ busy: false, error: false, message: 'new-endpoint-guid' }),
    unregister: vi.fn().mockResolvedValue({ busy: false, error: false, message: '' }),
  };
}

describe('GitRegistrationComponent', () => {
  let component: GitRegistrationComponent;
  let fixture: ComponentFixture<GitRegistrationComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubEndpointsSignalConfig>;
  let registerHandle: { close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    stubSignalConfig = makeStubEndpointsSignalConfig();
    registerHandle = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [
        GitRegistrationComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          createBasicStoreModule(),
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...gitEntityCatalog.allGitEntities()
          ]
        },
        EntityCatalogHelper,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        GitSCMService,
        { provide: EndpointsSignalConfigService, useValue: stubSignalConfig },
        // Rendered inside the Register Endpoint dialog
        { provide: ENDPOINT_REGISTER_HANDLE, useValue: registerHandle },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                subtype: 'github'
              },
              queryParams: {}
            }
          }
        }
      ]
    })
    .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(GitRegistrationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // One group, so arrow keys move between the types.
  it('groups the type radios under the step heading', async () => {
    // The form is built once the endpoint lists arrive.
    component['init']();
    component['cdr'].markForCheck();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const radios = Array.from(el.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
    expect(radios.length).toBeGreaterThan(1);
    const names = new Set(radios.map(r => r.getAttribute('name')));
    expect(names.size).toBe(1);
    expect([...names][0]).toBeTruthy();

    const group = el.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(group).toBeTruthy();
    radios.forEach(r => expect(group.contains(r)).toBe(true));
    const label = el.querySelector(`#${group.getAttribute('aria-labelledby')}`);
    expect(label?.textContent).toContain('Select the type of');
  });

  // Inside the Register Endpoint dialog the form closes the dialog through
  // its handle instead of navigating to the page under it.
  it('closes the dialog on Cancel', async () => {
    (fixture.nativeElement.querySelector('#stepper_cancel') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(registerHandle.close).toHaveBeenCalledWith(false);
  });

  it('closes the dialog, reporting the registration, when the Connect step finishes', async () => {
    component.connectRef = { onNext: () => of({ success: true, redirect: true }) } as never;
    await component.connectStepHandle.submit!();
    expect(registerHandle.close).toHaveBeenCalledWith(true);
  });

  describe('after Register', () => {
    beforeEach(async () => {
      stubSignalConfig.register.mockResolvedValue({ busy: false, error: false, message: '', guid: 'new-guid' });
      component['init']();
      component['cdr'].markForCheck();
      await fixture.whenStable();
      await component.registerStepHandle.submit!();
      await fixture.whenStable();
    });

    it('Previous from Connect keeps the endpoint and locks the fields', async () => {
      const openWithCancel = vi.spyOn(TestBed.inject(ConfirmationDialogService), 'openWithCancel');
      expect(component.connectStepHandle.onLeave).toBeUndefined();
      expect(openWithCancel).not.toHaveBeenCalled();
      expect(stubSignalConfig.unregister).not.toHaveBeenCalled();
      expect(component.registerForm.disabled).toBe(true);
      expect(component.registerStepHandle.nextButtonText!()).toBe('Next');
      expect(component.registerStepHandle.valid!()).toBe(true);
      expect(fixture.nativeElement.querySelector('#unregister')).not.toBeNull();
    });

    it('Next on the locked step goes on without registering again', async () => {
      stubSignalConfig.register.mockClear();
      const result = await component.registerStepHandle.submit!();
      expect(stubSignalConfig.register).not.toHaveBeenCalled();
      expect((result as { data: { guid: string } }).data.guid).toBe('new-guid');
    });

    it('Unregister reopens the Git form unlocked', async () => {
      vi.spyOn(TestBed.inject(ConfirmationDialogService), 'openWithCancel')
        .mockImplementation((_config, ok) => ok());
      await component.unregister();
      await fixture.whenStable();
      expect(stubSignalConfig.unregister).toHaveBeenCalledWith('new-guid', 'git');
      expect(component.registerForm.enabled).toBe(true);
      expect(component.registerStepHandle.nextButtonText!()).toBe('Register');
      expect(fixture.nativeElement.querySelector('#unregister')).toBeNull();
    });

    it('says "for you" in the row and the confirmation for a non-admin', async () => {
      expect(fixture.nativeElement.querySelector('#unregister')!.parentElement.textContent)
        .toContain('Remove this endpoint for you.');
      const openWithCancel = vi.spyOn(TestBed.inject(ConfirmationDialogService), 'openWithCancel')
        .mockImplementation((_config, _ok, cancel) => cancel());
      await component.unregister();
      expect(openWithCancel.mock.calls[0][0].message).toContain('for you');
      expect(openWithCancel.mock.calls[0][0].message).not.toContain('all users');
    });

    // The Connect step shows the error under the form; the stepper adds no
    // snackbar of its own.
    it('shows a failed connect once, inline', async () => {
      const error = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'error');
      const steppers = fixture.debugElement.query(By.directive(SteppersComponent)).componentInstance as SteppersComponent;
      steppers.setActive(1);
      await fixture.whenStable();
      const connect = fixture.debugElement.query(By.directive(CreateEndpointConnectComponent))
        .componentInstance as CreateEndpointConnectComponent;
      connect.onEnter({ guid: 'new-guid', name: 'GitHub', type: 'git', subType: 'github', ssoAllowed: false });
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

    // As the card menu does: the server's message, and the endpoint stays.
    it('reports a failed Unregister', async () => {
      stubSignalConfig.unregister.mockResolvedValue({ busy: false, error: true, message: 'Endpoint in use' });
      const show = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'show');
      vi.spyOn(TestBed.inject(ConfirmationDialogService), 'openWithCancel')
        .mockImplementation((_config, ok) => ok());
      await component.unregister();
      expect(show).toHaveBeenCalledWith('Endpoint in use');
      expect(component.registerForm.disabled).toBe(true);
    });

    it('Keep it leaves the endpoint registered and locked', async () => {
      vi.spyOn(TestBed.inject(ConfirmationDialogService), 'openWithCancel')
        .mockImplementation((_config, _ok, cancel) => cancel());
      await component.unregister();
      expect(stubSignalConfig.unregister).not.toHaveBeenCalled();
      expect(component.registerForm.disabled).toBe(true);
    });
  });
});
