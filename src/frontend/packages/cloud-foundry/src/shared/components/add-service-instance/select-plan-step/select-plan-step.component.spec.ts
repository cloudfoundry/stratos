import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { PaginationMonitorFactory } from '@stratosui/store';
import { generateCfBaseTestModulesNoShared } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServicePlanPriceComponent } from '../../service-plan-price/service-plan-price.component';
import { ServicePlanPublicComponent } from '../../service-plan-public/service-plan-public.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CsiModeService } from '../csi-mode.service';
import { SelectPlanStepComponent } from "./select-plan-step.component";

describe('SelectPlanStepComponent', () => {
  let component: SelectPlanStepComponent;
  let fixture: ComponentFixture<SelectPlanStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SelectPlanStepComponent,
        ServicePlanPublicComponent,
        ServicePlanPriceComponent,
        ...generateCfBaseTestModulesNoShared(),
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {},
              queryParamMap: {
                get: () => null
              }
            }
          }
        },
        CreateServiceInstanceHelperServiceFactory,
        CsiGuidsService,
        PaginationMonitorFactory,
        CsiModeService,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectPlanStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * The parent wizard's selectPlanHandle.valid reads this component's
   * `validate` signal. Whenever the user picks a plan in the dropdown,
   * the form control's value changes — the validate signal must follow
   * so the Next button activates.
   *
   * Regression captured: the original code only set validate inside the
   * one-shot servicePlans$ subscription in onEnter(); subsequent manual
   * plan picks never updated it. After onEnter set validate=false on
   * empty plan list, picking a plan kept validate stuck at false.
   */
  it('validate signal flips true when form control gets a valid plan guid', () => {
    expect(component.validate()).toBe(false);
    component.stepperForm.controls.servicePlans.setValue('some-plan-guid');
    expect(component.validate()).toBe(true);
  });

  it('validate signal flips false when form control is cleared', () => {
    component.stepperForm.controls.servicePlans.setValue('some-plan-guid');
    expect(component.validate()).toBe(true);
    component.stepperForm.controls.servicePlans.setValue('');
    expect(component.validate()).toBe(false);
  });
});
