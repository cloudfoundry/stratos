import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { defer, of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CurrentUserRolesDataService, EndpointModel, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { seedEndpointsDataService } from '@stratosui/store/testing';
import { BaseTestModules, STORE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { ConnectEndpointComponent } from './connect-endpoint.component';
import { ConnectEndpointData, ConnectEndpointService } from '../connect.service';

describe('ConnectEndpointComponent', () => {
  let component: ConnectEndpointComponent;
  let fixture: ComponentFixture<ConnectEndpointComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules,
        ConnectEndpointComponent,
      ],
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection(),
      ]
    });

    // Set up entity catalog helper from DI
    // Entities are registered automatically via BaseTestModules' CATALOGUE_ENTITIES provider
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ConnectEndpointComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('offers a username and password or no login for Metrics', async () => {
    component.connectService = {
      config: { name: 'metrics', guid: 'metrics-guid', type: 'metrics', subType: '', ssoAllowed: false },
      setData: () => undefined,
    } as unknown as ConnectEndpointService;
    await fixture.whenStable();
    expect(component.authTypesForEndpoint.map(a => a.value)).toEqual(['creds', 'none']);
  });

  // Metrics' username and password auth type gives no field labels of its
  // own; the fields still need a visible label and an accessible name.
  it('labels the username and password fields of an auth type without labels', async () => {
    component.connectService = {
      config: { name: 'metrics', guid: 'metrics-guid', type: 'metrics', subType: '', ssoAllowed: false },
      setData: () => undefined,
    } as unknown as ConnectEndpointService;
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const inputs = Array.from(el.querySelectorAll<HTMLInputElement>('app-credentials-auth-form input'));
    expect(inputs.map(i => i.placeholder)).toEqual(['Username', 'Password']);
    const labels = Array.from(el.querySelectorAll('app-credentials-auth-form label'));
    expect(labels.map(l => l.textContent?.replaceAll('*', '').trim())).toEqual(['Username', 'Password']);
    expect(labels.map(l => l.getAttribute('for'))).toEqual(inputs.map(i => i.id));
  });

  // The credentials are the endpoint's, not the console login the browser
  // saved for this site, so the browser must not fill that in.
  it('keeps the browser from filling in the console login', async () => {
    component.connectService = {
      config: { name: 'metrics', guid: 'metrics-guid', type: 'metrics', subType: '', ssoAllowed: false },
      setData: () => undefined,
    } as unknown as ConnectEndpointService;
    await fixture.whenStable();
    const inputs = Array.from(fixture.nativeElement.querySelectorAll('app-credentials-auth-form input')) as HTMLInputElement[];
    expect(inputs.map(i => i.getAttribute('autocomplete'))).toEqual(['off', 'new-password']);
  });

  // jetstream refuses a shared connect from anyone but a Stratos admin
  // (authcnsi.go DoLoginToCNSI), so only an admin is offered it.
  describe('sharing the connection', () => {
    const open = async (admin: boolean) => {
      TestBed.inject(CurrentUserRolesDataService).applySessionScopes({ admin, guid: 'me-guid', name: 'me', scopes: [] });
      fixture.componentRef.setInput('connectService', {
        config: { name: 'metrics', guid: 'metrics-guid', type: 'metrics', subType: '', ssoAllowed: false },
        setData: () => undefined,
      } as unknown as ConnectEndpointService);
      await fixture.whenStable();
    };

    it('is offered to a Stratos admin for a type that shares tokens', async () => {
      await open(true);
      expect(fixture.nativeElement.textContent).toContain('Share this endpoint connection');
    });

    it('is not offered to other users', async () => {
      await open(false);
      expect(fixture.nativeElement.textContent).not.toContain('Share this endpoint connection');
    });
  });

  // The TLS options are an edit of the endpoint, so the form offers them only
  // to a user who may edit it; the connect then saves them first.
  describe('TLS options', () => {
    let sent: ConnectEndpointData | undefined;

    const open = async (admin: boolean) => {
      TestBed.inject(CurrentUserRolesDataService).applySessionScopes({ admin, guid: 'me-guid', name: 'me', scopes: [] });
      seedEndpointsDataService([{
        guid: 'metrics-guid', name: 'metrics', cnsi_type: 'metrics', skip_ssl_validation: true, ca_cert: '',
        creator: { name: 'System Endpoint', admin: false, system: true },
      } as unknown as EndpointModel]);
      component.connectService = {
        config: { name: 'metrics', guid: 'metrics-guid', type: 'metrics', subType: '', ssoAllowed: false },
        setData: (data: ConnectEndpointData) => { sent = data; },
      } as unknown as ConnectEndpointService;
      await fixture.whenStable();
    };

    beforeEach(() => {
      sent = undefined;
    });

    it('offers them, filled in from the endpoint, to a user who may edit it', async () => {
      await open(true);
      expect(fixture.nativeElement.textContent).toContain('Skip SSL validation for the endpoint');
      expect(sent?.tls).toEqual({ skipSSL: true, caCert: '' });
    });

    it('sends the CA certificate in place of skipping validation', async () => {
      await open(true);
      component.endpointForm.get('tls')?.patchValue({ useCACert: true, caCert: 'PEM' });
      await fixture.whenStable();
      expect(sent?.tls).toEqual({ skipSSL: false, caCert: 'PEM' });
    });

    it('offers none to a user who may not edit the endpoint', async () => {
      await open(false);
      expect(fixture.nativeElement.textContent).not.toContain('Skip SSL validation for the endpoint');
      expect(sent?.tls).toBeUndefined();
    });
  });

  // The Connect dialog submits on Enter (formSubmit). The connect runs only
  // when its Observable is subscribed.
  it('connects when the form is submitted with Enter', async () => {
    const connected = vi.fn();
    fixture.componentRef.setInput('formSubmit', true);
    component.connectService = {
      config: { name: 'metrics', guid: 'metrics-guid', type: 'metrics', subType: '', ssoAllowed: false },
      setData: () => undefined,
      submit: () => defer(() => { connected(); return of({ success: true, errorMessage: '' }); }),
    } as unknown as ConnectEndpointService;
    await fixture.whenStable();
    component.endpointForm.get('authValues')?.patchValue({ username: 'u', password: 'p' });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(connected).toHaveBeenCalledTimes(1);
  });
});
