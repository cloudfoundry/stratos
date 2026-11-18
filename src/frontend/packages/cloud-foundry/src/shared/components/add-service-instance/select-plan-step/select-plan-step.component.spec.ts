import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

  beforeEach(async () => {
    fixture = TestBed.createComponent(SelectPlanStepComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The real helper acquires the endpoint's data, which writes signals, so
  // it cannot be built inside a computed.
  it('reads the plans of a picked service through the real helper', async () => {
    const csi = TestBed.inject(CsiStateService);
    csi.setCFDetails('cf-1', 'org-1', 'space-1');
    csi.setServiceGuid('svc-1');
    await fixture.whenStable();
    expect(component.servicePlans()).toEqual([]);
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
   * Regression captured: the original code only set validate when the
   * plans arrived in onEnter(); subsequent manual
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

  it('lists the plans in name order', async () => {
    plans.set([plan('plan-b'), plan('plan-a')]);
    await fixture.whenStable();
    expect(component.servicePlans()!.map(p => p.guid)).toEqual(['plan-a', 'plan-b']);
  });

  it('follows the picked service when the pick is completed later', async () => {
    const csi = TestBed.inject(CsiStateService);
    csi.setServiceGuid(null);
    await fixture.whenStable();
    // An incomplete pick keeps the plans of the last complete one
    expect(component.servicePlans()!.map(p => p.guid)).toEqual(['plan-a']);
  });

  it('selects the first plan on entry and answers it from onNext', async () => {
    plans.set([plan('plan-b'), plan('plan-a')]);
    component.onEnter();
    await fixture.whenStable();

    expect(component.stepperForm.controls.servicePlans.value).toBe('plan-a');
    expect(component.selectedPlan()?.guid).toBe('plan-a');
    expect(await component.onNext()).toEqual({ success: true, data: expect.objectContaining({ guid: 'plan-a' }) });
  });

  it('turns the plan pick off when the service has no plans', async () => {
    plans.set([]);
    await fixture.whenStable();
    expect(component.stepperForm.controls.servicePlans.disabled).toBe(true);

    plans.set([plan('plan-a')]);
    await fixture.whenStable();
    expect(component.stepperForm.controls.servicePlans.enabled).toBe(true);
  });
});
