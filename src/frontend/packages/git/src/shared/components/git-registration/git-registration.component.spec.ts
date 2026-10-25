import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
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

  // Previous from the Connect step unregisters the endpoint just registered,
  // so it asks first.
  it('asks before Previous unregisters the endpoint, and stays when the user declines', async () => {
    const openWithCancel = vi.spyOn(TestBed.inject(ConfirmationDialogService), 'openWithCancel')
      .mockImplementation((_config, _ok, cancel) => cancel());
    // As left by a successful Register (runRegistration).
    Object.assign(component, { registeredGuid: 'new-guid', registeredName: 'GitHub' });

    expect(await component.connectStepHandle.confirmPrevious!()).toBe(false);
    expect(openWithCancel.mock.calls[0][0].title).toBe('Unregister Endpoint');
    expect(openWithCancel.mock.calls[0][0].message).toContain('GitHub');
    expect(stubSignalConfig.unregister).not.toHaveBeenCalled();
  });
});
