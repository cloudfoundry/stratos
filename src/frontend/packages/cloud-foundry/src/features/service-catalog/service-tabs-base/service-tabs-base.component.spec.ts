import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, of } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { CoreModule, TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { cfCurrentUserPermissionsService } from '../../../user-permissions/cf-user-permissions-checkers';
import {
  EndpointDataRegistry,
} from '../../../services/endpoint-data/endpoint-data.registry';
import {
  ServiceCatalogDataService,
} from '../../../services/endpoint-data/service-catalog-data.service';
import {
  StServiceBroker,
  StServiceOffering,
  StServicePlan,
  StServicePlanVisibility,
} from '../../../services/endpoint-data/stratos-types';
import { ServiceTabsBaseComponent } from './service-tabs-base.component';

class FakeEndpointDataService {
  serviceInstances = () => [];
  servicePlans = () => [];
  serviceBrokers = () => [];
  isLoadingServicesDetails = () => false;
  servicesDetailsLastFetched = () => new Date();
  loadServicesDetails = (): Promise<void> => Promise.resolve();
  loadServicesCounts = (): Promise<void> => Promise.resolve();
}

class FakeRegistry {
  acquire(_guid: string): unknown { return new FakeEndpointDataService(); }
  release(_guid: string): void { /* noop */ }
}

class FakeCatalog {
  serviceOffering(_cnsi: string, _guid: string): Observable<StServiceOffering | null> {
    return of(null);
  }
  servicePlansForOffering(_cnsi: string, _guid: string): Observable<StServicePlan[]> {
    return of([]);
  }
  serviceBroker(_cnsi: string, _guid: string): Observable<StServiceBroker | null> {
    return of(null);
  }
  planVisibility(_cnsi: string, _guid: string): Observable<StServicePlanVisibility> {
    return of({ type: 'admin' });
  }
}

describe('ServiceTabsBaseComponent', () => {
  let component: ServiceTabsBaseComponent;
  let fixture: ComponentFixture<ServiceTabsBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ServiceTabsBaseComponent,
        CoreModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        TabNavService,
        { provide: EndpointDataRegistry, useClass: FakeRegistry },
        { provide: ServiceCatalogDataService, useClass: FakeCatalog },
        ...cfCurrentUserPermissionsService,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceTabsBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
