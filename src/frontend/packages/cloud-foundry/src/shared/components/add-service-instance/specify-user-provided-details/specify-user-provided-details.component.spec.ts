import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { generateCfBaseTestModulesNoShared } from "@test-framework/cf";
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { AppDetailDataService } from '../../../../features/applications/app-detail-data.service';
import { CloudFoundryUserProvidedServicesService } from '../../../services/cloud-foundry-user-provided-services.service';
import { ServiceCatalogDataService } from '../../../../services/endpoint-data/service-catalog-data.service';
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
        provideHttpClientTesting(),
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
      provideHttpClientTesting(),
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

// #5755 part 2 / #5768: credentials live behind a separate sub-resource
// (the ?return=summary read never carries them — native_types.go). The
// single-control area fetches them on load so the redacted structure preview
// renders immediately, but real values stay off-screen until an explicit
// reveal, and only enterEdit() puts them in the textarea. Blank textarea =
// leave stored credentials untouched on save.
describe('SpecifyUserProvidedDetailsComponent credentials reveal', () => {
  function setup(creds: Record<string, unknown> | null) {
    const upsServiceStub = {
      getUserProvidedServices: vi.fn().mockReturnValue(of([])),
      getUserProvidedService: vi.fn().mockReturnValue(of({
        name: 'my-ups', syslogDrainUrl: '', routeServiceUrl: '', tags: [],
      })),
      updateUserProvidedService: vi.fn().mockReturnValue(of({ success: true })),
    };
    const credsSpy = vi.fn().mockReturnValue({
      value: signal(creds),
      isLoading: signal(false),
      error: signal(null),
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SpecifyUserProvidedDetailsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        CsiModeService,
        CsiStateService,
        { provide: CloudFoundryUserProvidedServicesService, useValue: upsServiceStub },
        { provide: ServiceCatalogDataService, useValue: { userProvidedCredentials: credsSpy } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { endpointId: 'cf-1', serviceInstanceId: 'si-1' },
              queryParams: {},
              queryParamMap: { get: () => null },
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(SpecifyUserProvidedDetailsComponent);
    const component = fixture.componentInstance;
    component.cfGuid = 'cf-1';
    component.spaceGuid = 'space-1';
    component.serviceInstanceId = 'si-1';
    return { fixture, component, credsSpy };
  }

  it('fetches on load but keeps the textarea blank (blank = keep stored)', () => {
    const { fixture, component, credsSpy } = setup({ user: 'admin' });
    fixture.detectChanges();

    expect(credsSpy).toHaveBeenCalledTimes(1);
    expect(credsSpy).toHaveBeenCalledWith('cf-1', 'si-1');
    expect(component.createEditServiceInstance.controls.credentials.value).toBe('');
  });

  it('shows the redacted structure by default, real values only after toggleReveal', () => {
    const { fixture, component } = setup({ user: 'admin', password: 'p' });
    fixture.detectChanges();

    expect(component.credsMode()).toBe('redacted');
    expect(component.displayedCredentialsJson()).toContain('"user": "<redacted>"');
    expect(component.displayedCredentialsJson()).not.toContain('admin');

    component.toggleReveal();
    expect(JSON.parse(component.displayedCredentialsJson()!))
      .toEqual({ user: 'admin', password: 'p' });

    component.toggleReveal();
    expect(component.displayedCredentialsJson()).not.toContain('admin');
  });

  it('enterEdit fills the textarea from the sub-resource; cancelEdit blanks it', () => {
    const { fixture, component } = setup({ user: 'admin', password: 'p' });
    fixture.detectChanges();

    component.enterEdit();
    expect(component.credsMode()).toBe('edit');
    expect(JSON.parse(component.createEditServiceInstance.controls.credentials.value))
      .toEqual({ user: 'admin', password: 'p' });

    component.cancelEdit();
    expect(component.credsMode()).toBe('redacted');
    expect(component.createEditServiceInstance.controls.credentials.value).toBe('');
  });

  it('reveal and edit round-trips are not edits — Next stays disabled', () => {
    const { fixture, component } = setup({ user: 'admin' });
    fixture.detectChanges();

    component.toggleReveal();
    fixture.detectChanges();
    expect(component.validate()).toBe(false);

    component.enterEdit();
    component.cancelEdit();
    fixture.detectChanges();
    expect(component.validate()).toBe(false);
  });

  it('fetches once — reveal and edit reuse the loaded sub-resource', () => {
    const { fixture, component, credsSpy } = setup({ user: 'admin' });
    fixture.detectChanges();

    component.toggleReveal();
    component.enterEdit();

    expect(credsSpy).toHaveBeenCalledTimes(1);
  });
});

// The create form as the user meets it: what app-form-field renders for
// each field, read from the DOM.
describe('SpecifyUserProvidedDetailsComponent create form', () => {
  async function setup() {
    const upsServiceStub = {
      getUserProvidedServices: vi.fn().mockReturnValue(of([])),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SpecifyUserProvidedDetailsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        CsiModeService,
        CsiStateService,
        { provide: CloudFoundryUserProvidedServicesService, useValue: upsServiceStub },
      ],
    });
    const fixture = TestBed.createComponent(SpecifyUserProvidedDetailsComponent);
    const component = fixture.componentInstance;
    component.cfGuid = 'cf-1';
    component.spaceGuid = 'space-1';
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    return { fixture, component, host };
  }

  /** The input a visible label names, as a screen reader pairs them. */
  function labelledInput(host: HTMLElement, text: string): HTMLInputElement | null {
    const label = [...host.querySelectorAll('label')].find(l => l.textContent?.trim() === text);
    return label?.htmlFor ? host.querySelector<HTMLInputElement>(`#${label.htmlFor}`) : null;
  }

  /** What app-form-field shows for a field, through the input's aria-errormessage. */
  function errorFor(host: HTMLElement, input: Element): string | undefined {
    const id = input.getAttribute('aria-errormessage');
    return id ? host.querySelector(`#${id}`)?.textContent?.trim() : undefined;
  }

  function type(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // app-form-field shows one error line per field and does not project
  // <app-error> children, so each check must carry its own text.
  it('names what is wrong with a URL or the credentials', async () => {
    const { fixture, host } = await setup();
    const route = host.querySelector<HTMLInputElement>('input[placeholder="Route Service URL"]')!;
    const drain = host.querySelector<HTMLInputElement>('input[placeholder="Syslog Drain URL"]')!;
    const creds = host.querySelector<HTMLTextAreaElement>('textarea[aria-label="Credentials (JSON)"]')!;
    type(route, 'not a url');
    type(drain, 'ftp://logs.example.com');
    type(creds, '["e2e"]');
    await fixture.whenStable();

    expect(errorFor(host, route)).toBe('Invalid URL');
    expect(errorFor(host, drain)).toBe('Invalid URL');
    expect(errorFor(host, creds)).toBe('Not a valid JSON object.');
  });

  it('shows the name check in progress, then says the name is taken', async () => {
    const { fixture, host } = await setup();
    const http = TestBed.inject(HttpTestingController);
    const name = host.querySelector<HTMLInputElement>('input[placeholder="Name"]')!;
    const suffix = name.closest('app-form-field')!.querySelector('.form-field-suffix')!;
    type(name, 'my-ups');
    await fixture.whenStable();
    expect(suffix.querySelector('app-stateful-icon app-busy'), 'busy while checking').toBeTruthy();

    // The check asks CF once typing pauses for 500ms.
    await new Promise(resolve => setTimeout(resolve, 550));
    http.expectOne(r => r.url === '/pp/v1/cf/service_instances/cf-1' && r.params.get('names') === 'my-ups')
      .flush({ resources: [], totalResults: 1 });
    await fixture.whenStable();

    expect(errorFor(host, name)).toBe('A service instance with this name already exists. Please enter a different one.');
    expect(suffix.querySelector('app-busy'), 'not busy once answered').toBeNull();
  });

  it('renders a labelled Tags field; Enter adds a tag and its remove button names it', async () => {
    const { fixture, host } = await setup();
    const input = labelledInput(host, 'Tags');
    expect(input, 'a Tags label tied to an input').toBeTruthy();

    input!.value = 'db';
    input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();

    const chips = [...host.querySelectorAll('.stepper-form__tags span.rounded-full')]
      .map(e => e.textContent?.replace('cancel', '').trim());
    expect(chips).toEqual(['db']);
    expect(host.querySelector('button[aria-label="Remove tag db"]')).toBeTruthy();
  });

  // CF takes syslog, syslog-tls and https drains; the route service URL
  // keeps the shared http(s) check.
  it('accepts syslog, syslog-tls, http and https drains only', async () => {
    const { component } = await setup();
    const drain = component.createEditServiceInstance.controls.syslog_drain_url;
    for (const url of [
      'syslog://logs.example.com:514',
      'syslog-tls://logs.example.com:6514',
      'https://logs.example.com/drain',
      'http://logs.example.com/drain',
    ]) {
      drain.setValue(url);
      expect(drain.valid, url).toBe(true);
    }
    for (const url of ['ftp://logs.example.com', 'syslog:/logs.example.com', 'logs.example.com:514']) {
      drain.setValue(url);
      expect(drain.valid, url).toBe(false);
    }
    const route = component.createEditServiceInstance.controls.route_service_url;
    route.setValue('syslog://logs.example.com:514');
    expect(route.valid).toBe(false);
  });
});
