import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { ServiceCatalogDataService, SignalSource } from '../../../../services/endpoint-data/service-catalog-data.service';
import { SpaceDataRegistry } from '../../../../services/endpoint-data/space-data.registry';
import { StServiceBroker, StSpace } from '../../../../services/endpoint-data/stratos-types';
import { ServiceBrokerCardComponent } from './service-broker-card.component';

class ServiceCatalogDataServiceStub {
  brokerResponse: StServiceBroker | null = {
    guid: 'a55f1a04-e3a3-4a89-92ee-94e3f96103f3',
    name: 'app-autoscaler',
    url: 'https://app-autoscaler-broker.cf-dev.io',
    space: undefined,
    labels: {},
    annotations: {},
    cnsiGuid: 'test-cf-guid',
    createdAt: '2017-11-27T17:07:02Z',
    updatedAt: '2017-11-27T17:07:02Z',
    _meta: { unavailable: ['authUsername'] },
  };

  // When set, the broker value starts null and the test sets it, the way
  // the HTTP response lands after the first render.
  lateBroker: ReturnType<typeof signal<StServiceBroker | null>> | null = null;

  serviceBroker(_cnsi: string, _broker: string): SignalSource<StServiceBroker | null> {
    return {
      value: (this.lateBroker ?? signal(this.brokerResponse)).asReadonly(),
      isLoading: signal(false).asReadonly(),
      error: signal<HttpErrorResponse | null>(null).asReadonly(),
    };
  }
}

// Space lookup lands after the first render, the same as the real
// SpaceDataService: `space` stays null until `load()` emits.
class SpaceDataRegistryStub {
  readonly space = signal<StSpace | null>(null);
  readonly loaded = new Subject<void>();
  acquired: string[] = [];

  acquire(cnsi: string, spaceGuid: string) {
    this.acquired.push(`${cnsi}/${spaceGuid}`);
    return {
      space: this.space.asReadonly(),
      load: (): Observable<void> => this.loaded,
    };
  }

  land(space: StSpace): void {
    this.space.set(space);
    this.loaded.next();
  }
}

describe('ServiceBrokerCardComponent', () => {
  let component: ServiceBrokerCardComponent;
  let fixture: ComponentFixture<ServiceBrokerCardComponent>;
  let catalogStub: ServiceCatalogDataServiceStub;
  let spaceStub: SpaceDataRegistryStub;

  const setup = async () => {
    catalogStub = new ServiceCatalogDataServiceStub();
    spaceStub = new SpaceDataRegistryStub();
    await TestBed.configureTestingModule({
      imports: [ServiceBrokerCardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        { provide: ServiceCatalogDataService, useValue: catalogStub },
        { provide: SpaceDataRegistry, useValue: spaceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceBrokerCardComponent);
    component = fixture.componentInstance;
    component.cfGuid = 'test-cf-guid';
    component.brokerGuid = catalogStub.brokerResponse!.guid;
    await fixture.whenStable();
  };

  beforeEach(async () => setup());

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders the broker name from the V3-native shape', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toContain('Name');
    expect(host.textContent).toContain('app-autoscaler');
  });

  it('renders the Broker Link row alongside the Name row', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toContain('Broker Link');
    const launch = host.querySelector('a[target="_blank"]');
    expect(launch?.getAttribute('href')).toBe('https://app-autoscaler-broker.cf-dev.io');
  });

  it('gives the Broker Link a name that says where it goes and that it opens a new tab', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector('a[target="_blank"]')!;
    // Accessible name: aria-label wins; otherwise the text minus aria-hidden parts.
    const visible = link.cloneNode(true) as HTMLElement;
    visible.querySelectorAll('[aria-hidden="true"]').forEach(el => el.remove());
    const name = (link.getAttribute('aria-label') ?? visible.textContent ?? '').replace(/\s+/g, ' ').trim();
    expect(name).toContain('https://app-autoscaler-broker.cf-dev.io');
    expect(name).toContain('(opens in a new tab)');
    expect(name).not.toContain('launch');
  });

  it('renders "Not Available" for authUsername when listed in _meta.unavailable', () => {
    const host: HTMLElement = fixture.nativeElement;
    const unavailable = host.querySelector('app-tristate-value .tristate-value--unavailable');
    expect(unavailable?.textContent).toBe('Not Available');
  });

  it('renders the authUsername value when the field is populated and not unavailable', async () => {
    catalogStub.brokerResponse = {
      ...catalogStub.brokerResponse!,
      authUsername: 'broker-admin',
      _meta: { unavailable: [] },
    };
    fixture = TestBed.createComponent(ServiceBrokerCardComponent);
    component = fixture.componentInstance;
    component.cfGuid = 'test-cf-guid';
    component.brokerGuid = catalogStub.brokerResponse.guid;
    await fixture.whenStable();

    const host: HTMLElement = fixture.nativeElement;
    const known = host.querySelector('app-tristate-value .tristate-value--known');
    expect(known?.textContent).toBe('broker-admin');
    expect(host.querySelector('app-tristate-value .tristate-value--unavailable')).toBeNull();
  });

  it('renders the Space row once the space-scoped broker\'s space loads', async () => {
    const spaceScoped: StServiceBroker = {
      ...catalogStub.brokerResponse!,
      space: { guid: 'space-guid' },
    };
    catalogStub.lateBroker = signal<StServiceBroker | null>(null);
    fixture = TestBed.createComponent(ServiceBrokerCardComponent);
    component = fixture.componentInstance;
    component.cfGuid = 'test-cf-guid';
    component.brokerGuid = spaceScoped.guid;
    await fixture.whenStable();
    expect(spaceStub.acquired).toEqual([]);

    catalogStub.lateBroker.set(spaceScoped);
    await fixture.whenStable();
    expect(spaceStub.acquired).toEqual(['test-cf-guid/space-guid']);

    spaceStub.land({
      guid: 'space-guid',
      name: 'broker-space',
      orgGuid: 'org-guid',
      createdAt: '',
      updatedAt: '',
      cnsiGuid: 'test-cf-guid',
      appCount: 0,
      routeCount: 0,
    } as StSpace);
    await fixture.whenStable();

    const link = (fixture.nativeElement as HTMLElement).querySelector('a[href*="/spaces/"]');
    expect(link?.textContent).toBe('broker-space');
    expect(link?.getAttribute('href')).toBe(
      '/cloud-foundry/test-cf-guid/organizations/org-guid/spaces/space-guid/summary',
    );
  });
});
