import { type ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { EntityMonitorFactory, EntityServiceFactory, StratosStatus } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import * as servicesHelpers from '../../../features/service-catalog/services-helper';
import { ServicesService } from '../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../features/service-catalog/services.service.mock';
import { ServicePlanPublicComponent } from './service-plan-public.component';

describe('ServicePlanPublicComponent', () => {
  let component: ServicePlanPublicComponent;
  let fixture: ComponentFixture<ServicePlanPublicComponent>;
  let element: HTMLElement;
  let servicesService: ServicesServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ServicePlanPublicComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        EntityServiceFactory,
        EntityMonitorFactory,
        { provide: ServicesService, useClass: ServicesServiceMock },
        { provide: ComponentFixtureAutoDetect, useValue: true },
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicePlanPublicComponent);
    servicesService = TestBed.inject(ServicesService) as unknown as ServicesServiceMock;
    component = fixture.componentInstance;
    // Don't call detectChanges here - let each test control when it runs
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display if service plan is public', () => {
    component.servicePlan = servicesService.servicePlan;
    fixture.detectChanges();
    fixture.detectChanges(); // Second detectChanges for async pipes

    // Debug: check if servicePlan is set
    expect(component.servicePlan).toBeTruthy();
    expect(component.servicePlan.entity.public).toBe(true);
    expect(element.textContent?.trim()).toContain('Yes');
  });

  it('should display if service plan is not public', () => {
    component.servicePlan = {
      ...servicesService.servicePlan,
      entity: {
        ...servicesService.servicePlan.entity,
        public: false,
      }
    };
    fixture.detectChanges();
    fixture.detectChanges(); // Second detectChanges for async pipes

    expect(element.textContent?.trim()).toContain('No');
  });

  it('should display if service plan is reachable', () => {
    const planAccessibility$ = of(StratosStatus.WARNING);
    vi.spyOn(servicesHelpers, 'getServicePlanAccessibilityCardStatus').mockReturnValue(planAccessibility$);
    component.servicePlan = servicesService.servicePlan;
    fixture.detectChanges();
    fixture.detectChanges(); // Second detectChanges for async pipes

    expect(element.textContent?.trim()).toContain('Service Plan has limited visibility');
  });

  it('should display if service plan is not reachable', () => {
    const planAccessibility$ = of(StratosStatus.ERROR);
    vi.spyOn(servicesHelpers, 'getServicePlanAccessibilityCardStatus').mockReturnValue(planAccessibility$);
    component.servicePlan = servicesService.servicePlan;
    fixture.detectChanges();
    fixture.detectChanges(); // Second detectChanges for async pipes

    expect(element.textContent?.trim()).toContain('Service Plan has no visibility');
  });
});
