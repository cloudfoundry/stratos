import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityMonitorFactory, EntityServiceFactory } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { ServiceCatalogDataService, SignalSource } from '../../../../services/endpoint-data/service-catalog-data.service';
import { StServiceBroker } from '../../../../services/endpoint-data/stratos-types';
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

  serviceBroker(_cnsi: string, _broker: string): SignalSource<StServiceBroker | null> {
    return {
      value: signal(this.brokerResponse).asReadonly(),
      isLoading: signal(false).asReadonly(),
      error: signal<HttpErrorResponse | null>(null).asReadonly(),
    };
  }
}

describe('ServiceBrokerCardComponent', () => {
  let component: ServiceBrokerCardComponent;
  let fixture: ComponentFixture<ServiceBrokerCardComponent>;
  let catalogStub: ServiceCatalogDataServiceStub;

  const setup = async () => {
    catalogStub = new ServiceCatalogDataServiceStub();
    await TestBed.configureTestingModule({
      imports: [ServiceBrokerCardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        EntityServiceFactory,
        EntityMonitorFactory,
        { provide: ServiceCatalogDataService, useValue: catalogStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceBrokerCardComponent);
    component = fixture.componentInstance;
    component.cfGuid = 'test-cf-guid';
    component.brokerGuid = catalogStub.brokerResponse!.guid;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
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
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const known = host.querySelector('app-tristate-value .tristate-value--known');
    expect(known?.textContent).toBe('broker-admin');
    expect(host.querySelector('app-tristate-value .tristate-value--unavailable')).toBeNull();
  });
});
