import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { of } from 'rxjs';

import { EntityService } from '@stratosui/store/entity-service';
import { EntityMonitorFactory } from '@stratosui/store/monitors/entity-monitor.factory.service';
import { StratosStatus } from '@stratosui/store/types/shared.types';
import { generateCfBaseTestModulesNoShared } from "@test-framework/cloud-foundry-endpoint-service.helper";
import * as servicesHelpers from '../../../features/service-catalog/services-helper';
import { ServicesService } from '../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../features/service-catalog/services.service.mock';
import { ServicePlanPublicComponent } from './service-plan-public.component';
import { EntityServiceFactory } from "@stratosui/store/entity-service-factory.service";
const getCfService = {
  waitForEntity$: {
    pipe() { }
  }
} as unknown as EntityService;

describe('ServicePlanPublicComponent', () => {
  let component: ServicePlanPublicComponent;
  let fixture: ComponentFixture<ServicePlanPublicComponent>;
  let element: HTMLElement;
  let servicesService: ServicesServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ServicePlanPublicComponent,
        ...generateCfBaseTestModulesNoShared(),
      ],
      providers: [
        EntityServiceFactory,
        
        EntityMonitorFactory,
        { provide: ServicesService, useClass: ServicesServiceMock },

        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicePlanPublicComponent);
    servicesService = TestBed.inject(ServicesService);
    component = fixture.componentInstance;
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display if service plan is public', () => {
    component.servicePlan = servicesService.servicePlan;
    fixture.detectChanges();

    expect(element.textContent).toContain('Yes');
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

    expect(element.textContent).toContain('No');
  });

  it('should display if service plan is reachable', () => {
    const planAccessibility$ = of(StratosStatus.WARNING);
    const s0 = vi.spyOn(servicesHelpers, 'getServicePlanAccessibilityCardStatus').mockReturnValue(planAccessibility$);
    component.servicePlan = servicesService.servicePlan;
    fixture.detectChanges();

    expect(s0).toHaveBeenCalled();
    expect(element.textContent).toContain('Service Plan has limited visibility');
  });

  it('should display if service plan is not reachable', () => {
    const planAccessibility$ = of(StratosStatus.ERROR);
    const s0 = vi.spyOn(servicesHelpers, 'getServicePlanAccessibilityCardStatus').mockReturnValue(planAccessibility$);
    component.servicePlan = servicesService.servicePlan;
    fixture.detectChanges();

    expect(s0).toHaveBeenCalled();
    expect(element.textContent).toContain('Service Plan has no visibility');
  });
});
