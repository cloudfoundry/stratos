import { ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { Observable, of, throwError } from 'rxjs';

import { EntityMonitorFactory, EntityServiceFactory } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { ServicesService } from '../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../features/service-catalog/services.service.mock';
import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';
import { StServicePlanVisibility } from '../../../services/endpoint-data/stratos-types';
import { ServicePlanPublicComponent } from './service-plan-public.component';

class ServiceCatalogDataServiceStub {
  visibilityResponse: StServicePlanVisibility | null = { type: 'public' };
  errorOnVisibility = false;

  planVisibility(_cnsi: string, _planGuid: string): Observable<StServicePlanVisibility | null> {
    if (this.errorOnVisibility) {
      return throwError(() => new Error('forced error'));
    }
    return of(this.visibilityResponse);
  }
}

describe('ServicePlanPublicComponent', () => {
  let component: ServicePlanPublicComponent;
  let fixture: ComponentFixture<ServicePlanPublicComponent>;
  let element: HTMLElement;
  let servicesService: ServicesServiceMock;
  let catalogStub: ServiceCatalogDataServiceStub;

  beforeEach(async () => {
    catalogStub = new ServiceCatalogDataServiceStub();
    await TestBed.configureTestingModule({
      imports: [ServicePlanPublicComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        EntityServiceFactory,
        EntityMonitorFactory,
        { provide: ServicesService, useClass: ServicesServiceMock },
        { provide: ServiceCatalogDataService, useValue: catalogStub },
        { provide: ComponentFixtureAutoDetect, useValue: true },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicePlanPublicComponent);
    servicesService = TestBed.inject(ServicesService) as unknown as ServicesServiceMock;
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders Yes when the plan is public', () => {
    component.servicePlan = servicesService.servicePlan;
    fixture.detectChanges();
    fixture.detectChanges();

    expect(component.servicePlan.entity.public).toBe(true);
    expect(element.textContent?.trim()).toContain('Yes');
  });

  it('renders No when the plan is not public', () => {
    component.servicePlan = {
      ...servicesService.servicePlan,
      entity: { ...servicesService.servicePlan.entity, public: false },
    };
    fixture.detectChanges();
    fixture.detectChanges();

    expect(element.textContent?.trim()).toContain('No');
  });

  it('shows "limited visibility" when V3 visibility is organization', () => {
    catalogStub.visibilityResponse = { type: 'organization', organizations: [{ guid: 'o-1' }] };
    component.servicePlan = {
      ...servicesService.servicePlan,
      entity: { ...servicesService.servicePlan.entity, public: false },
    };
    fixture.detectChanges();
    fixture.detectChanges();

    expect(element.textContent).toContain('Service Plan has limited visibility');
  });

  it('shows "limited visibility" when V3 visibility is space', () => {
    catalogStub.visibilityResponse = { type: 'space', space: { guid: 's-1' } };
    component.servicePlan = {
      ...servicesService.servicePlan,
      entity: { ...servicesService.servicePlan.entity, public: false },
    };
    fixture.detectChanges();
    fixture.detectChanges();

    expect(element.textContent).toContain('Service Plan has limited visibility');
  });

  it('shows "no visibility" when V3 visibility is admin-only', () => {
    catalogStub.visibilityResponse = { type: 'admin' };
    component.servicePlan = {
      ...servicesService.servicePlan,
      entity: { ...servicesService.servicePlan.entity, public: false },
    };
    fixture.detectChanges();
    fixture.detectChanges();

    expect(element.textContent).toContain('Service Plan has no visibility');
  });

  it('falls through to "no visibility" when the visibility lookup errors', () => {
    catalogStub.errorOnVisibility = true;
    component.servicePlan = {
      ...servicesService.servicePlan,
      entity: { ...servicesService.servicePlan.entity, public: false },
    };
    fixture.detectChanges();
    fixture.detectChanges();

    expect(element.textContent).toContain('Service Plan has no visibility');
  });
});
