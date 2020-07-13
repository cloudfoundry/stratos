import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EntityService } from '../../../../../store/src/entity-service';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { StratosStatus } from '../../../../../store/src/types/shared.types';
import { generateCfBaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import * as servicesHelpers from '../../../features/service-catalog/services-helper';
import { ServicesService } from '../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../features/service-catalog/services.service.mock';
import { ServicePlanPublicComponent } from './service-plan-public.component';

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

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServicePlanPublicComponent],
      imports: generateCfBaseTestModulesNoShared(),
      providers: [
        EntityMonitorFactory,
        { provide: ServicesService, useClass: ServicesServiceMock },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicePlanPublicComponent);
    servicesService = TestBed.get(ServicesService);
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
    const s0 = spyOn(servicesHelpers, 'getServicePlanAccessibilityCardStatus').and.returnValue(planAccessibility$);
    component.servicePlan = servicesService.servicePlan;
    fixture.detectChanges();

    expect(s0).toHaveBeenCalled();
    expect(element.textContent).toContain('Service Plan has limited visibility');
  });

  it('should display if service plan is not reachable', () => {
    const planAccessibility$ = of(StratosStatus.ERROR);
    const s0 = spyOn(servicesHelpers, 'getServicePlanAccessibilityCardStatus').and.returnValue(planAccessibility$);
    component.servicePlan = servicesService.servicePlan;
    fixture.detectChanges();

    expect(s0).toHaveBeenCalled();
    expect(element.textContent).toContain('Service Plan has no visibility');
  });
});
