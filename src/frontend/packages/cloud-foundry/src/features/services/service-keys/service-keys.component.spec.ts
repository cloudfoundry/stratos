import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
