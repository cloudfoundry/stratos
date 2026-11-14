import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateCfBaseTestModulesNoShared } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServicePlanPriceComponent } from '../../service-plan-price/service-plan-price.component';
import { ServicePlanPublicComponent } from '../../service-plan-public/service-plan-public.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CsiModeService } from '../csi-mode.service';
import { CsiStateService } from '../csi-state.service';
import { StServicePlan } from '../../../../services/endpoint-data/stratos-types';
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
        CsiStateService,
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

  // The caption is shown inside the empty drop-down and is also its name.
  it('shows and names its drop-down "Choose Service Plan"', async () => {
    await fixture.whenStable();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector('[role="combobox"]');
    expect(trigger).toBeTruthy();
    expect(trigger!.getAttribute('aria-label')).toBe('Choose Service Plan');
    expect(trigger!.textContent).toContain('Choose Service Plan');
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

  // selectedPlan$ follows the form and never completes, so onNext has to take
  // the first plan and let go of the stream.
  it('onNext resolves with the first selected plan and stops listening', async () => {
    const plans = new Subject<unknown>();
    (component as unknown as { selectedPlan$: Subject<unknown> }).selectedPlan$ = plans;
    const plan = { guid: 'plan-1' };

    const pending = component.onNext();
    plans.next(plan);

    expect(await pending).toEqual({ success: true, data: plan });
    expect(plans.observed).toBe(false);
  });
});

describe('SelectPlanStepComponent plan list', () => {
  const plan = (guid: string) => ({ guid, name: guid, cnsiGuid: 'cf-1' }) as unknown as StServicePlan;
  let plans: WritableSignal<StServicePlan[]>;
  let fixture: ComponentFixture<SelectPlanStepComponent>;
  let component: SelectPlanStepComponent;

  beforeEach(async () => {
    plans = signal([plan('plan-a')]);
    TestBed.configureTestingModule({
      imports: [SelectPlanStepComponent, ...generateCfBaseTestModulesNoShared()],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {}, queryParamMap: { get: () => null } } } },
        {
          provide: CreateServiceInstanceHelperServiceFactory,
          useValue: { create: () => ({ servicePlans: plans, load: () => Promise.resolve() }) },
        },
        CsiGuidsService,
        CsiStateService,
        CsiModeService,
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SelectPlanStepComponent);
    component = fixture.componentInstance;
    const csi = TestBed.inject(CsiStateService);
    csi.setCFDetails('cf-1', 'org-1', 'space-1');
    csi.setServiceGuid('svc-1');
    await fixture.whenStable();
  });

  // Going back and forward again enters the step again; the earlier entry
  // must not keep re-picking the plan too.
  it('picks a plan once per plan list change after the step is entered twice', async () => {
    component.onEnter();
    await fixture.whenStable();
    component.onEnter();
    await fixture.whenStable();
    const setValue = vi.spyOn(component.stepperForm.controls.servicePlans, 'setValue');

    plans.set([plan('plan-a'), plan('plan-b')]);
    await fixture.whenStable();

    expect(setValue).toHaveBeenCalledTimes(1);
  });
});
