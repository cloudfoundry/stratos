import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { EndpointModel, EndpointsDataService, entityCatalog, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers, StratosCatalogEndpointEntity } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { TailwindSnackBarService } from '../../../../shared/services/tailwind-snackbar.service';
import { EndpointCertificatesService } from '../../certificates/endpoint-certificates.service';
import { EndpointPermissionsService } from '../../endpoint-permissions.service';
import { EndpointsSignalConfigService } from '../../endpoints-page/endpoints-signal-config.service';
import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1.component';

function makeStubEndpointsSignalConfig() {
  return {
    // Only the methods create-endpoint-cf-step-1 touches need stubs; the rest
    // of the service's signal/computed surface is not read by this component.
    register: vi.fn().mockResolvedValue({ busy: false, error: false, message: 'new-endpoint-guid' }),
    unregister: vi.fn().mockResolvedValue({ busy: false, error: false, message: '' }),
  };
}

describe('CreateEndpointCfStep1Component', () => {
  let component: CreateEndpointCfStep1Component;
  let fixture: ComponentFixture<CreateEndpointCfStep1Component>;
  let stubSignalConfig: ReturnType<typeof makeStubEndpointsSignalConfig>;
  let canManage: ReturnType<typeof vi.fn>;
  let confirmAnswer: boolean;

  beforeEach(async () => {
    stubSignalConfig = makeStubEndpointsSignalConfig();
    canManage = vi.fn().mockReturnValue(true);
    confirmAnswer = true;
    // Clear and register entities BEFORE TestBed configuration for Angular 20
    (entityCatalog as any).clear();
    const entities = generateStratosEntities();
    entities.forEach(entity => entityCatalog.register(entity));

    // Register a minimal CF endpoint for this test
    const cfEndpoint = new StratosCatalogEndpointEntity({
      type: 'cf',
      label: 'Cloud Foundry',
      labelPlural: 'Cloud Foundry',
      logoUrl: '/core/assets/endpoint-icons/cloudfoundry.svg',
      authTypes: [],
      renderPriority: 1,
      tokenSharing: true
    }, entity => `/cloud-foundry/${entity.guid}/summary`);
    entityCatalog.register(cfEndpoint);

    await TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        CreateEndpointCfStep1Component,
      ],
      providers: [
        { provide: EndpointsSignalConfigService, useValue: stubSignalConfig },
        { provide: EndpointPermissionsService, useValue: { canManage } },
        {
          provide: EndpointCertificatesService,
          useValue: { decode: vi.fn().mockResolvedValue([]), checkTrust: vi.fn().mockResolvedValue([]) },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
              params: { type: 'cf' }
            }
          }
        },
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(CreateEndpointCfStep1Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('labels the CA certificate box with its caption', () => {
    const root: HTMLElement = fixture.nativeElement;
    const box = root.querySelector('textarea[formControlName="caCertField"]');
    expect(box?.id, 'box has an id').toBeTruthy();
    expect(root.querySelector(`label[for="${box!.id}"]`)?.textContent?.trim()).toBe('Specify CA Certificate:');
  });

  // The hidden Advanced Options sit under the Name field, so a browser
  // with a saved console login filled it in as Client ID and Client Secret.
  it('keeps the browser from filling the console login into the client credentials', () => {
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('#client_id')?.getAttribute('autocomplete')).toBe('off');
    expect(root.querySelector('#client_secret')?.getAttribute('autocomplete')).toBe('new-password');
  });

  describe('URL Validation', () => {
    it('should accept valid hostnames without protocol', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('api.example.com');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();

      urlControl.setValue('api.sys.example.com');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();

      urlControl.setValue('my-api.example.io');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should accept valid URLs with https protocol', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('https://api.example.com');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();

      urlControl.setValue('https://api.sys.example.com');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should accept valid URLs with http protocol', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('http://api.example.com');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should accept URLs with port numbers', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('api.example.com:8080');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();

      urlControl.setValue('https://api.example.com:443');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should accept URLs with paths', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('https://api.example.com/v2/info');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();

      urlControl.setValue('api.example.com/path/to/api');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should accept IP addresses', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('192.168.1.1');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();

      urlControl.setValue('https://10.0.0.1:8080');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should reject invalid URLs', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('not a url');
      expect(urlControl.valid).toBe(false);
      expect(urlControl.errors?.invalidUrl).toBeTruthy();

      urlControl.setValue('ht!tp://example.com');
      expect(urlControl.valid).toBe(false);
      expect(urlControl.errors?.invalidUrl).toBeTruthy();

      urlControl.setValue('');
      expect(urlControl.valid).toBe(false);
      expect(urlControl.errors?.required).toBe(true);
    });

    it('should handle whitespace in URLs', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('  api.example.com  ');
      // Validator trims whitespace, so this should be valid
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });
  });

  describe('URL Normalization', () => {
    it('should have a valid form when all required fields are filled', () => {
      component.registerForm.controls.nameField.setValue('Test Endpoint');
      component.registerForm.controls.urlField.setValue('api.example.com');

      expect(component.registerForm.valid).toBe(true);
    });

    it('should trim whitespace from URL field', () => {
      const urlControl = component.registerForm.controls.urlField;
      urlControl.setValue('  api.example.com  ');

      expect(urlControl.valid).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should require a name', () => {
      const nameControl = component.registerForm.controls.nameField;

      nameControl.setValue('');
      expect(nameControl.valid).toBe(false);
      expect(nameControl.errors?.required).toBe(true);

      nameControl.setValue('Test Endpoint');
      expect(nameControl.valid).toBe(true);
      expect(nameControl.errors).toBeNull();
    });

    it('should require a URL', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('');
      expect(urlControl.valid).toBe(false);
      expect(urlControl.errors?.required).toBe(true);

      urlControl.setValue('api.example.com');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should have invalid form when required fields are empty', () => {
      expect(component.registerForm.valid).toBe(false);
    });
  });
  // app-form-field shows a field's <app-error> text as its error line.
  describe('field errors', () => {
    function type(input: HTMLInputElement, value: string) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /** What app-form-field shows for a field, through the input's aria-errormessage. */
    function errorFor(input: HTMLInputElement): string | undefined {
      const id = input.getAttribute('aria-errormessage');
      const host: HTMLElement = fixture.nativeElement;
      return id ? host.querySelector(`#${id}`)?.textContent?.replace(/\s+/g, ' ').trim() : undefined;
    }

    it('says the name is required once it is cleared', async () => {
      const name = fixture.nativeElement.querySelector('#name') as HTMLInputElement;
      type(name, 'x');
      type(name, '');
      await fixture.whenStable();

      expect(errorFor(name)).toBe('Name is required');
    });

    it('explains a bad API address', async () => {
      const url = fixture.nativeElement.querySelector('#url') as HTMLInputElement;
      type(url, 'not a url');
      await fixture.whenStable();

      expect(errorFor(url)).toBe(
        'Invalid API URL. Enter a valid hostname or URL (e.g., api.example.com or https://api.example.com)'
      );
    });
  });

  // Review mode: the step shows what is registered. Name and address are
  // locked; for those who may manage the endpoint, TLS stays editable.
  describe('review', () => {
    const PEM = '-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----';
    let update: ReturnType<typeof vi.fn>;

    function endpoint(over: Partial<EndpointModel> = {}): EndpointModel {
      return {
        guid: 'ep-guid',
        name: 'my-cf',
        cnsi_type: 'cf',
        api_endpoint: { Scheme: 'https', Host: 'api.example.com', Path: '' },
        skip_ssl_validation: false,
        sso_allowed: false,
        system_shared_token: false,
        creator: { name: 'admin', admin: true, system: true },
        ...over,
      } as EndpointModel;
    }

    async function review(ep: EndpointModel) {
      fixture = TestBed.createComponent(CreateEndpointCfStep1Component);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('reviewEndpoint', ep);
      await fixture.whenStable();
    }

    const q = (sel: string) => (fixture.nativeElement as HTMLElement).querySelector(sel) as HTMLElement | null;
    const text = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');

    beforeEach(() => {
      update = vi.fn().mockResolvedValue({ busy: false, error: false, message: '' });
      vi.spyOn(TestBed.inject(EndpointsDataService), 'update').mockImplementation(update as never);
      vi.spyOn(TestBed.inject(ConfirmationDialogService), 'openWithCancel')
        .mockImplementation((_c, ok, cancel) => confirmAnswer ? ok() : cancel());
    });

    it('locks the form after registering', async () => {
      component.registerForm.controls.nameField.setValue('my-cf');
      component.registerForm.controls.urlField.setValue('api.example.com');
      stubSignalConfig.register.mockResolvedValue({ busy: false, error: false, message: '', guid: 'g1' });
      await new Promise(resolve => component.onNext(0, {} as never).subscribe(resolve));
      await fixture.whenStable();

      expect(component.review()).toBe(true);
      expect(component.registerForm.controls.nameField.disabled).toBe(true);
      expect(component.registerForm.controls.urlField.disabled).toBe(true);
      expect(component.registerForm.controls.skipSSLField.disabled).toBe(false);
      expect(q('#skipSSL')).toBeTruthy();
    });

    it('fills the form from the endpoint and locks name and address', async () => {
      await review(endpoint({ skip_ssl_validation: true }));
      expect(component.review()).toBe(true);
      expect(component.registerForm.controls.nameField.value).toBe('my-cf');
      expect(component.registerForm.controls.urlField.value).toBe('https://api.example.com');
      expect(component.registerForm.controls.nameField.disabled).toBe(true);
      expect(component.registerForm.controls.skipSSLField.value).toBe(true);
    });

    it('saves nothing on Next when TLS is unchanged', async () => {
      await review(endpoint({ ca_cert: PEM }));
      const result = await new Promise<any>(resolve => component.onNext(0, {} as never).subscribe(resolve));
      expect(update).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({ guid: 'ep-guid', name: 'my-cf', type: 'cf' }));
    });

    it('changing only Skip SSL sends the stored ca_cert', async () => {
      // CA box off: the stored CA is empty, and the request must say so.
      await review(endpoint());
      component.registerForm.controls.skipSSLField.setValue(true);
      await new Promise(resolve => component.onNext(0, {} as never).subscribe(resolve));
      expect(update).toHaveBeenCalledWith('ep-guid', expect.objectContaining({ skipSSL: true, caCert: '', setClientInfo: false }));
    });

    it('sends the stored PEM when something other than the PEM changes', async () => {
      // Stored with both a CA and skip-SSL; a CA wins, so Next normalises skip-SSL off.
      await review(endpoint({ ca_cert: PEM, skip_ssl_validation: true }));
      await new Promise(resolve => component.onNext(0, {} as never).subscribe(resolve));
      expect(update).toHaveBeenCalledWith('ep-guid', expect.objectContaining({ skipSSL: false, caCert: PEM }));
    });

    it('sends an empty CA when the CA box is turned off', async () => {
      await review(endpoint({ ca_cert: PEM }));
      component.toggleCACertField();
      await new Promise(resolve => component.onNext(0, {} as never).subscribe(resolve));
      expect(update).toHaveBeenCalledWith('ep-guid', expect.objectContaining({ caCert: '' }));
    });

    it('reports a failed save', async () => {
      update.mockResolvedValue({ busy: false, error: true, message: 'nope' });
      await review(endpoint());
      component.registerForm.controls.skipSSLField.setValue(true);
      const result = await new Promise<any>(resolve => component.onNext(0, {} as never).subscribe(resolve));
      expect(result).toEqual(expect.objectContaining({ success: false, message: 'nope' }));
    });

    it('shows Client ID and the system-endpoint checkbox locked, filled from the endpoint', async () => {
      TestBed.inject(EndpointsDataService);
      await review(endpoint({ client_id: 'my-client', creator: { name: 'me', admin: false, system: false } }));
      expect(component.registerForm.controls.clientIDField.value).toBe('my-client');
      expect(component.registerForm.controls.clientIDField.disabled).toBe(true);
      expect(component.registerForm.controls.createSystemEndpointField.value).toBe(false);
      expect(component.registerForm.controls.createSystemEndpointField.disabled).toBe(true);
      expect(q('#client_id')).toBeTruthy();
    });

    it('keeps edits in progress when the same endpoint arrives as a new object', async () => {
      await review(endpoint());
      component.registerForm.controls.skipSSLField.setValue(true);
      fixture.componentRef.setInput('reviewEndpoint', endpoint());
      await fixture.whenStable();
      expect(component.registerForm.controls.skipSSLField.value).toBe(true);
    });

    it('starts clean when a different endpoint is shown', async () => {
      await review(endpoint({ ca_cert: PEM }));
      expect(component.registerForm.controls.skipSSLField.disabled).toBe(true);
      fixture.componentRef.setInput('reviewEndpoint', endpoint({ guid: 'other', name: 'other-cf', skip_ssl_validation: true }));
      await fixture.whenStable();
      expect(component.showCACertField()).toBe(false);
      expect(component.registerForm.controls.skipSSLField.enabled).toBe(true);
      expect(component.registerForm.controls.skipSSLField.value).toBe(true);
      expect(component.registerForm.controls.nameField.value).toBe('other-cf');
    });

    it('never shows the Client Secret in review', async () => {
      await review(endpoint());
      expect(q('#client_secret')).toBeNull();
    });

    it('shows the UAA note under TLS', async () => {
      await review(endpoint());
      expect(text()).toContain('Applies to the endpoint address and its login server (UAA).');
    });

    it('shows no TLS controls to those who cannot manage the endpoint, but still the certificates', async () => {
      canManage.mockReturnValue(false);
      await review(endpoint({ ca_cert: PEM }));
      expect(q('#skipSSL')).toBeNull();
      expect(q('#useCACert')).toBeNull();
      expect(q('#ca-cert')).toBeNull();
      expect(q('app-endpoint-certificates')).toBeTruthy();
    });

    it('offers Unregister only to managers', async () => {
      await review(endpoint());
      expect(text()).toContain('Remove this endpoint for all users. Connections to it end.');
      const button = q('#unregister') as HTMLButtonElement;
      expect(button.textContent!.trim()).toBe('Unregister…');
      expect(button.className).toContain('btn-danger');

      canManage.mockReturnValue(false);
      await review(endpoint());
      expect(q('#unregister')).toBeNull();
    });

    it('says "for you" on a personal endpoint', async () => {
      await review(endpoint({ creator: { name: 'me', admin: false, system: false } }));
      expect(text()).toContain('Remove this endpoint for you. Connections to it end.');
    });

    it('reopens unlocked after Unregister in the Register flow', async () => {
      component.registerForm.controls.nameField.setValue('my-cf');
      component.registerForm.controls.urlField.setValue('api.example.com');
      stubSignalConfig.register.mockResolvedValue({ busy: false, error: false, message: '', guid: 'g1' });
      await new Promise(resolve => component.onNext(0, {} as never).subscribe(resolve));
      const emitted = vi.fn();
      component.unregistered.subscribe(emitted);

      await component.unregister();
      await fixture.whenStable();

      expect(stubSignalConfig.unregister).toHaveBeenCalledWith('g1', 'cf');
      expect(component.review()).toBe(false);
      expect(component.registerForm.controls.nameField.enabled).toBe(true);
      expect(component.registerForm.controls.nameField.value).toBe('my-cf');
      expect(emitted).toHaveBeenCalled();
    });

    // Git hosts take no CA certificate, so their review has no TLS to edit or show.
    it('reviews a Git endpoint locked, with no TLS and no certificate cards', async () => {
      await review(endpoint({ cnsi_type: 'git', sub_type: 'github', name: 'my-github' }));
      expect(component.registerForm.controls.nameField.disabled).toBe(true);
      expect(component.registerForm.controls.urlField.disabled).toBe(true);
      expect(q('#skipSSL')).toBeNull();
      expect(q('#useCACert')).toBeNull();
      expect(q('#ca-cert')).toBeNull();
      expect(q('app-endpoint-certificates')).toBeNull();
      expect(q('#unregister')).toBeTruthy();

      component.registerForm.controls.skipSSLField.setValue(true);
      const result = await new Promise<any>(resolve => component.onNext(0, {} as never).subscribe(resolve));
      expect(update).not.toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ success: true, data: expect.objectContaining({ type: 'git' }) }));
    });

    // As the card menu does: the server's message, and the endpoint stays.
    it('reports a failed Unregister', async () => {
      stubSignalConfig.unregister.mockResolvedValue({ busy: false, error: true, message: 'Endpoint in use' });
      const show = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'show');
      await review(endpoint());
      const emitted = vi.fn();
      component.unregistered.subscribe(emitted);
      await component.unregister();
      expect(show).toHaveBeenCalledWith('Endpoint in use');
      expect(component.review()).toBe(true);
      expect(emitted).not.toHaveBeenCalled();
    });

    it('stays put when the user keeps the endpoint', async () => {
      confirmAnswer = false;
      await review(endpoint());
      const emitted = vi.fn();
      component.unregistered.subscribe(emitted);
      const show = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'show');
      await component.unregister();
      expect(stubSignalConfig.unregister).not.toHaveBeenCalled();
      expect(component.review()).toBe(true);
      expect(emitted).not.toHaveBeenCalled();
      expect(show).not.toHaveBeenCalled();
    });
  });
});
