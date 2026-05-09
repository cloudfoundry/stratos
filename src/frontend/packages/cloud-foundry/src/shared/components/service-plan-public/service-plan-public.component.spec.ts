import { ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { Observable, of, throwError } from 'rxjs';

import { EntityMonitorFactory, EntityServiceFactory } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';
import { StServicePlan, StServicePlanVisibility } from '../../../services/endpoint-data/stratos-types';
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

const buildPlan = (overrides: Partial<StServicePlan> = {}): StServicePlan => ({
  guid: 'plan-1',
  cnsiGuid: 'cnsi-1',
  name: 'small',
  visibilityType: 'public',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('ServicePlanPublicComponent', () => {
  let component: ServicePlanPublicComponent;
  let fixture: ComponentFixture<ServicePlanPublicComponent>;
  let element: HTMLElement;
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
        { provide: ServiceCatalogDataService, useValue: catalogStub },
        { provide: ComponentFixtureAutoDetect, useValue: true },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicePlanPublicComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders Yes when the plan is public', () => {
    component.servicePlan = buildPlan({ visibilityType: 'public' });
    fixture.detectChanges();
    fixture.detectChanges();

    expect(component.servicePlan?.visibilityType).toBe('public');
    expect(element.textContent?.trim()).toContain('Yes');
  });

  it('renders No when the plan is not public', () => {
    component.servicePlan = buildPlan({ visibilityType: 'admin' });
    fixture.detectChanges();
    fixture.detectChanges();

    expect(element.textContent?.trim()).toContain('No');
  });

  it('shows "limited visibility" when V3 visibility is organization', () => {
    catalogStub.visibilityResponse = { type: 'organization', organizations: [{ guid: 'o-1' }] };
    component.servicePlan = buildPlan({ visibilityType: 'organization' });
    fixture.detectChanges();
    fixture.detectChanges();

    expect(element.textContent).toContain('Service Plan has limited visibility');
  });

  it('shows "limited visibility" when V3 visibility is space', () => {
    catalogStub.visibilityResponse = { type: 'space', space: { guid: 's-1' } };
    component.servicePlan = buildPlan({ visibilityType: 'space' });
    fixture.detectChanges();
    fixture.detectChanges();

    expect(element.textContent).toContain('Service Plan has limited visibility');
  });

  it('shows "no visibility" when V3 visibility is admin-only', () => {
    catalogStub.visibilityResponse = { type: 'admin' };
    component.servicePlan = buildPlan({ visibilityType: 'admin' });
    fixture.detectChanges();
    fixture.detectChanges();

    expect(element.textContent).toContain('Service Plan has no visibility');
  });

  it('falls through to "no visibility" when the visibility lookup errors', () => {
    catalogStub.errorOnVisibility = true;
    component.servicePlan = buildPlan({ visibilityType: 'admin' });
    fixture.detectChanges();
    fixture.detectChanges();

    expect(element.textContent).toContain('Service Plan has no visibility');
  });
});
