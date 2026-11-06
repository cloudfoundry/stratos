import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ServiceKeysComponent } from './service-keys.component';
import { ServiceCatalogDataService, ServiceKeyView } from '../../../services/endpoint-data/service-catalog-data.service';
import { CfEndpointsDataService } from '../../../services/domain-data/cf-endpoints-data.service';
import { StServiceInstance } from '../../../services/endpoint-data/stratos-types';

// SignalSource triple with a static value — null instance ⇒ the component
// builds without firing the offering/bindable fetch.
function source<T>(value: T) {
  return {
    value: signal(value).asReadonly(),
    isLoading: signal(false).asReadonly(),
    error: signal(null).asReadonly(),
  };
}

const spinner = (el: HTMLElement) => el.querySelector('.animate-spin');

describe('ServiceKeysComponent — busy-state spinners', () => {
  let component: ServiceKeysComponent;
  let fixture: ComponentFixture<ServiceKeysComponent>;
  let keysVal: WritableSignal<ServiceKeyView[]>;
  let keysLoading: WritableSignal<boolean>;

  beforeEach(async () => {
    keysVal = signal<ServiceKeyView[]>([]);
    keysLoading = signal(false);

    await TestBed.configureTestingModule({
      imports: [ServiceKeysComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: ServiceCatalogDataService,
          useValue: {
            serviceInstance: () => source(null),
            // Backed by the writable signals above so tests can drive the
            // list value + loading flag through the component's source.
            serviceKeysForInstance: () => ({
              value: keysVal.asReadonly(),
              isLoading: keysLoading.asReadonly(),
              error: signal(null).asReadonly(),
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceKeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('no spinner when idle', () => {
    expect(spinner(fixture.nativeElement)).toBeNull();
  });

  it('shows a spinner while the key list is loading (GET)', () => {
    keysLoading.set(true);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).not.toBeNull();

    keysLoading.set(false);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).toBeNull();
  });

  it('shows a spinner in the create form while creating', () => {
    component.isAdding.set(true);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).toBeNull();

    component.creating.set(true);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).not.toBeNull();

    component.creating.set(false);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).toBeNull();
  });

  it('shows a spinner while a key\'s credentials are loading (GET)', () => {
    keysVal.set([{ guid: 'k1', name: 'key-one', createdAt: '' }]);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).toBeNull();

    // Expanding triggers the lazy credential GET; the request stays pending
    // under HttpTestingController, so credsLoading('k1') stays true.
    component.toggleOpen('k1');
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).not.toBeNull();
  });

  it('does not fetch credentials for a key whose creation failed, and says so', () => {
    const http = TestBed.inject(HttpTestingController);
    keysVal.set([{ guid: 'k-f', name: 'broken', createdAt: '2026-09-05T09:12:29Z', lastOperationState: 'failed' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Copy all (JSON)');

    component.toggleOpen('k-f');
    fixture.detectChanges();
    http.expectNone(r => r.url.includes('/details'));
    expect(fixture.nativeElement.textContent).toContain('This key was not created, so it has no credentials.');
    expect(fixture.nativeElement.textContent).not.toContain('Failed to load credentials');
  });

  it('names the HTTP failure when credentials cannot be loaded', async () => {
    const http = TestBed.inject(HttpTestingController);
    keysVal.set([{ guid: 'k-1', name: 'ok', createdAt: '2026-09-05T09:12:29Z', lastOperationState: 'succeeded' }]);
    fixture.detectChanges();
    component.toggleOpen('k-1');
    http.expectOne(r => r.url.endsWith('/k-1/details')).flush(
      { error: 'Service key not found' }, { status: 404, statusText: 'Not Found' },
    );
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(component.credsError('k-1')).toBe('Service key not found (404)');
    expect(fixture.nativeElement.textContent).not.toContain('unknown error');
  });

  it('shows a spinner on the delete action while deleting', () => {
    keysVal.set([{ guid: 'k1', name: 'key-one', createdAt: '' }]);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).toBeNull();

    // Fire-and-forget: the DELETE stays pending, rowStatus('k1') === 'busy'.
    void component.deleteKey('k1');
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).not.toBeNull();
  });
});

describe('ServiceKeysComponent — context-aware breadcrumbs', () => {
  // A managed instance carrying its space + organization (populated at the
  // summary tier the keys page fetches), so the CF trail is buildable.
  const instanceWithSpace = (): StServiceInstance => ({
    guid: 'si-1', cnsiGuid: 'cf-1', name: 'cache', type: 'managed',
    tags: [], lastOperation: {}, createdAt: '',
    space: { guid: 'sp-1', name: 'dev', organization: { guid: 'org-1', name: 'acme' } },
  } as StServiceInstance);

  function setup(
    instance: StServiceInstance | null,
    endpoints: { guid?: string; name: string }[],
  ): ServiceKeysComponent {
    TestBed.configureTestingModule({
      imports: [ServiceKeysComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { endpointId: 'cf-1', serviceInstanceId: 'si-1' } } } },
        {
          provide: ServiceCatalogDataService,
          useValue: {
            serviceInstance: () => source(instance),
            serviceKeysForInstance: () => source([] as ServiceKeyView[]),
          },
        },
        { provide: CfEndpointsDataService, useValue: { connectedCfList: signal(endpoints).asReadonly() } },
      ],
    });
    return TestBed.createComponent(ServiceKeysComponent).componentInstance;
  }

  it('always offers the global wall as the default (no-key) breadcrumb', () => {
    const c = setup(null, []);
    const def = c.breadcrumbs().find(b => b.key === undefined);
    expect(def?.breadcrumbs).toEqual([{ value: 'Services', routerLink: '/services' }]);
  });

  it('cf key points back to this endpoint\'s CF services tab, labelled with the endpoint name', () => {
    const c = setup(instanceWithSpace(), [{ guid: 'cf-1', name: 'prod-cf' }]);
    const cf = c.breadcrumbs().find(b => b.key === 'cf');
    expect(cf?.breadcrumbs).toEqual([
      { value: 'prod-cf', routerLink: '/cloud-foundry/cf-1/services' },
    ]);
  });

  it('space-services key renders the full endpoint -> org -> space trail to the space\'s service-instances tab', () => {
    const c = setup(instanceWithSpace(), [{ guid: 'cf-1', name: 'prod-cf' }]);
    const trail = c.breadcrumbs().find(b => b.key === 'space-services');
    expect(trail?.breadcrumbs).toEqual([
      { value: 'prod-cf', routerLink: '/cloud-foundry/cf-1/organizations' },
      { value: 'acme', routerLink: '/cloud-foundry/cf-1/organizations/org-1/spaces' },
      { value: 'dev', routerLink: '/cloud-foundry/cf-1/organizations/org-1/spaces/sp-1/service-instances' },
    ]);
  });

  it('omits the space-services trail until the instance (with its space/org) has loaded', () => {
    const c = setup(null, [{ guid: 'cf-1', name: 'prod-cf' }]);
    expect(c.breadcrumbs().find(b => b.key === 'space-services')).toBeUndefined();
  });
});

describe('ServiceKeysComponent — createKey patches the list from the response', () => {
  let component: ServiceKeysComponent;
  let fixture: ComponentFixture<ServiceKeysComponent>;
  let http: HttpTestingController;
  let listFetches: number;
  const existing: ServiceKeyView = { guid: 'k-1', name: 'first', createdAt: '2026-01-01T00:00:00Z', lastOperationState: 'succeeded' };

  beforeEach(async () => {
    listFetches = 0;
    await TestBed.configureTestingModule({
      imports: [ServiceKeysComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { endpointId: 'cf-1', serviceInstanceId: 'si-1' } } } },
        {
          provide: ServiceCatalogDataService,
          useValue: {
            serviceInstance: () => source(null),
            serviceKeysForInstance: () => { listFetches++; return source([existing]); },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ServiceKeysComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('appends the created key from a 201 body without refetching the list', async () => {
    component.newKeyName.set('second');
    const done = component.createKey();
    http.expectOne(r => r.method === 'POST' && r.url === '/pp/v1/cf/service_keys/cf-1').flush(
      { guid: 'k-2', type: 'key', name: 'second', created_at: '2026-02-02T00:00:00Z', last_operation: { state: 'succeeded' } },
      { status: 201, statusText: 'Created' },
    );
    await done;

    expect(component.keys().map(k => k.guid)).toEqual(['k-1', 'k-2']);
    expect(component.keys()[1]).toEqual({ guid: 'k-2', name: 'second', createdAt: '2026-02-02T00:00:00Z', lastOperationState: 'succeeded' });
    expect(listFetches).toBe(1);
  });

  it('shows a failed job\'s title and detail in the shared error banner', async () => {
    component.newKeyName.set('broken');
    const done = component.createKey();
    http.expectOne(r => r.method === 'POST' && r.url === '/pp/v1/cf/service_keys/cf-1').flush(
      { id: 'job-1', kind: 'cf.service_key.create', state: 'RUNNING', startedAt: 't', updatedAt: 't' },
      { status: 202, statusText: 'Accepted' },
    );
    // pollJob waits its first backoff step before the first GET.
    await new Promise(resolve => setTimeout(resolve, 700));
    http.expectOne(r => r.method === 'GET' && r.url === '/pp/v1/stratos/jobs/job-1').flush({
      id: 'job-1', kind: 'cf.service_key.create', state: 'FAILED', startedAt: 't', updatedAt: 't',
      errors: [{ code: 'cf.v3.10009', message: 'CF-UnableToPerform', detail: 'The service broker returned an invalid response. Status Code: 504 Gateway Timeout' }],
    });
    await done;
    fixture.detectChanges();

    expect(component.errorMessage()).toBe(
      'Failed to create key: CF-UnableToPerform. The service broker returned an invalid response. Status Code: 504 Gateway Timeout',
    );
    const banner = fixture.nativeElement.querySelector('.dialog-error') as HTMLElement | null;
    expect(banner?.textContent).toContain('CF-UnableToPerform. The service broker');
    expect(banner?.querySelector('.material-icons')?.textContent).toBe('warning');
    expect(component.keys().map(k => k.guid)).toEqual(['k-1']);
    expect(listFetches).toBe(1);
  });

  it('falls back to a refetch when the response is a completed job rather than the key', async () => {
    component.newKeyName.set('async');
    const done = component.createKey();
    http.expectOne(r => r.method === 'POST' && r.url === '/pp/v1/cf/service_keys/cf-1').flush(
      { state: 'COMPLETE', result: { guid: 'job-9', operation: 'service_key.create', state: 'COMPLETE' } },
      { status: 200, statusText: 'OK' },
    );
    await done;

    expect(component.keys().map(k => k.guid)).toEqual(['k-1']);
    expect(listFetches).toBe(2);
  });
});
