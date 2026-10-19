import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createEmptyStoreModule } from '@stratosui/store/testing';
import { ActivatedRoute } from '@angular/router';

import { ApplicationService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import { TabNavService } from '@stratosui/core';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { autoscalerTransformArrayToMap } from '../../../core/autoscaler-helpers/autoscaler-transform-policy';
import { AutoscalerConstants } from '../../../core/autoscaler-helpers/autoscaler-util';
import { AppScalingRule } from '../../../store/app-autoscaler.types';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';
import { EditAutoscalerPolicyStep2Component } from './edit-autoscaler-policy-step2.component';

describe('EditAutoscalerPolicyStep2Component', () => {
  let component: EditAutoscalerPolicyStep2Component;
  let fixture: ComponentFixture<EditAutoscalerPolicyStep2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditAutoscalerPolicyStep2Component,
        CfAutoscalerTestingModule,
        NoopAnimationsModule,
        createEmptyStoreModule(),
        RouterTestingModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
        EditAutoscalerPolicyService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {}
            }
          }
        }
      ]
    })
      .compileComponents();
  });

  // Seed the shared policy before the first render: the template's async
  // pipe is what hands the policy to the step.
  function create(scalingRules: AppScalingRule[] = []) {
    TestBed.inject(EditAutoscalerPolicyService).setState(autoscalerTransformArrayToMap({
      instance_min_count: 1,
      instance_max_count: 10,
      scaling_rules: scalingRules,
      schedules: { timezone: 'UTC', recurring_schedule: [], specific_date: [] },
    }));
    fixture = TestBed.createComponent(EditAutoscalerPolicyStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const rule = (overrides: Partial<AppScalingRule> = {}): AppScalingRule => ({
    metric_type: 'memoryused',
    operator: '>',
    threshold: 80,
    adjustment: '+1',
    breach_duration_secs: 120,
    cool_down_secs: 300,
    ...overrides,
  });

  // Put a control through the validators the user's edits would run.
  function setControl(name: keyof typeof component.editTriggerForm.controls, value: unknown) {
    const control = component.editTriggerForm.controls[name];
    control.setValue(value as never);
    return control;
  }

  it('should be created', () => {
    create();
    expect(component).toBeTruthy();
  });

  describe('rule list', () => {
    // A new rule starts from the default trigger and opens in edit mode,
    // which is what disables Next and Add until the user confirms it.
    it('adds the default rule and puts its row in edit mode', () => {
      create();
      component.addTrigger();

      expect(component.currentPolicy.scaling_rules_form).toHaveLength(1);
      expect(component.currentPolicy.scaling_rules_form[0]).toEqual(AutoscalerConstants.PolicyDefaultTrigger);
      expect(component.editIndex).toBe(0);
      expect(component.editTriggerForm.getRawValue()).toEqual({
        metric_type: 'memoryused',
        operator: '<=',
        threshold: 10,
        adjustment: 1,
        breach_duration_secs: 120,
        cool_down_secs: 300,
        adjustment_type: 'value',
      });
    });

    // The default trigger is a shared constant; editing the new row must
    // not change the template for the next added rule.
    it('copies the default rule instead of sharing it', () => {
      create();
      component.addTrigger();
      setControl('threshold', 42);
      component.finishTrigger();

      expect(AutoscalerConstants.PolicyDefaultTrigger.threshold).toBe(10);
    });

    it('writes the form back to the rule and leaves edit mode on confirm', () => {
      create();
      component.addTrigger();
      setControl('metric_type', 'cpu');
      setControl('operator', '>=');
      setControl('threshold', 90);
      setControl('adjustment', 2);
      setControl('breach_duration_secs', 600);
      setControl('cool_down_secs', 900);
      component.finishTrigger();

      expect(component.editIndex).toBe(-1);
      expect(component.currentPolicy.scaling_rules_form[0]).toEqual({
        metric_type: 'cpu',
        operator: '>=',
        threshold: 90,
        adjustment: '+2',
        breach_duration_secs: 600,
        cool_down_secs: 900,
      });
    });

    // An emptied duration field is stored as the autoscaler default, not 0.
    it('falls back to the default durations when they are cleared', () => {
      create();
      component.addTrigger();
      setControl('breach_duration_secs', 0);
      setControl('cool_down_secs', 0);
      component.finishTrigger();

      const saved = component.currentPolicy.scaling_rules_form[0];
      expect(saved.breach_duration_secs).toBe(AutoscalerConstants.PolicyDefaultSetting.breach_duration_secs_default);
      expect(saved.cool_down_secs).toBe(AutoscalerConstants.PolicyDefaultSetting.cool_down_secs_default);
    });

    it('stores a percentage step with a % suffix', () => {
      create();
      component.addTrigger();
      setControl('operator', '>');
      setControl('adjustment_type', 'percentage');
      setControl('adjustment', 50);
      component.finishTrigger();

      expect(component.currentPolicy.scaling_rules_form[0].adjustment).toBe('+50%');
    });

    it('loads an existing rule into the form for editing', () => {
      create([rule({ metric_type: 'throughput', operator: '<', threshold: 30, adjustment: '-2' })]);
      component.editTrigger(0);

      expect(component.editIndex).toBe(0);
      expect(component.editTriggerForm.getRawValue()).toEqual({
        metric_type: 'throughput',
        operator: '<',
        threshold: 30,
        adjustment: 2,
        breach_duration_secs: 120,
        cool_down_secs: 300,
        adjustment_type: 'value',
      });

      setControl('threshold', 25);
      component.finishTrigger();

      expect(component.currentPolicy.scaling_rules_form).toHaveLength(1);
      expect(component.currentPolicy.scaling_rules_form[0]).toMatchObject({ threshold: 25, adjustment: '-2' });
    });

    // The autoscaler stores a percentage step as e.g. '-20%'; editing such
    // a rule must show 20, and confirming it unchanged must keep '-20%'.
    it('loads a percentage step into the form for editing', () => {
      create([rule({ metric_type: 'throughput', operator: '<', threshold: 30, adjustment: '-20%' })]);
      component.editTrigger(0);

      expect(component.editTriggerForm.controls.adjustment_type.value).toBe('percentage');
      expect(component.editTriggerForm.controls.adjustment.value).toBe(20);

      component.finishTrigger();
      expect(component.currentPolicy.scaling_rules_form[0].adjustment).toBe('-20%');
    });

    it('removes a rule', () => {
      create([rule({ metric_type: 'cpu' }), rule({ metric_type: 'throughput' })]);
      component.removeTrigger(0);

      expect(component.currentPolicy.scaling_rules_form.map(r => r.metric_type)).toEqual(['throughput']);
    });

    // Removing the row being edited must leave edit mode, or Next stays
    // disabled for a row that no longer exists.
    it('leaves edit mode when the edited rule is removed', () => {
      create();
      component.addTrigger();
      component.removeTrigger(0);

      expect(component.editIndex).toBe(-1);
      expect(component.currentPolicy.scaling_rules_form).toHaveLength(0);
    });

    it('stays in edit mode when another rule is removed', () => {
      create([rule({ metric_type: 'cpu' })]);
      component.addTrigger();
      component.removeTrigger(0);

      expect(component.editIndex).toBe(1);
    });
  });

  describe('threshold', () => {
    beforeEach(() => {
      create();
      component.addTrigger();
    });

    // Utilization metrics and cpu are percentages; disk is in MB.
    it.each([
      ['memoryutil', 100],
      ['cpu', 100],
      ['cpuutil', 100],
      ['diskutil', 100],
      ['disk', 2048],
    ])('accepts 1 to %s max %i and rejects one more', (metric, max) => {
      expect(AutoscalerConstants.getMetricThresholdMax(metric)).toBe(max);
      setControl('metric_type', metric);

      expect(setControl('threshold', 1).hasError('alertInvalidPolicyTriggerThreshold100')).toBe(false);
      expect(setControl('threshold', max).hasError('alertInvalidPolicyTriggerThreshold100')).toBe(false);
      expect(setControl('threshold', max + 1).hasError('alertInvalidPolicyTriggerThreshold100')).toBe(true);
    });

    // memoryused is absolute MB with no autoscaler cap.
    it('has no upper limit for memoryused', () => {
      setControl('metric_type', 'memoryused');
      const threshold = setControl('threshold', 100000);

      expect(threshold.valid).toBe(true);
    });

    it('rejects a fraction and anything below 1', () => {
      setControl('metric_type', 'memoryused');

      expect(setControl('threshold', 1.5).hasError('alertInvalidPolicyTriggerThresholdRange')).toBe(true);
      expect(setControl('threshold', 0).valid).toBe(false);
    });

    // The limit follows the metric: changing the metric must re-check a
    // threshold the user already entered.
    it('re-checks the threshold when the metric changes', () => {
      setControl('metric_type', 'memoryused');
      const threshold = setControl('threshold', 500);
      expect(threshold.valid).toBe(true);

      setControl('metric_type', 'cpuutil');
      expect(threshold.hasError('alertInvalidPolicyTriggerThreshold100')).toBe(true);
    });
  });

  describe('scale type', () => {
    // A lower (scale-in) rule must stay below the upper rule for the same
    // metric. Switching the operator to an upper one lifts that limit.
    it('limits a lower rule by the upper rule, and drops the limit for an upper operator', () => {
      create([rule({ metric_type: 'memoryused', operator: '>', threshold: 80 })]);
      component.addTrigger();
      const threshold = setControl('threshold', 80);
      expect(threshold.hasError('alertInvalidPolicyTriggerThresholdRange')).toBe(true);
      expect(setControl('threshold', 79).valid).toBe(true);

      setControl('threshold', 80);
      setControl('operator', '>=');
      expect(threshold.hasError('alertInvalidPolicyTriggerThresholdRange')).toBe(false);
    });

    it('limits an upper rule by the lower rule for the same metric only', () => {
      create([rule({ metric_type: 'memoryused', operator: '<', threshold: 50, adjustment: '-1' })]);
      component.addTrigger();
      setControl('operator', '>');

      expect(setControl('threshold', 50).hasError('alertInvalidPolicyTriggerThresholdRange')).toBe(true);
      expect(setControl('threshold', 51).valid).toBe(true);

      setControl('threshold', 50);
      setControl('metric_type', 'throughput');
      expect(component.editTriggerForm.controls.threshold.valid).toBe(true);
    });

    // The sign of the stored step comes from the operator, not the form.
    it.each([
      ['>', '+3'],
      ['>=', '+3'],
      ['<', '-3'],
      ['<=', '-3'],
    ])('stores operator %s with step %s', (operator, adjustment) => {
      create();
      component.addTrigger();
      setControl('operator', operator);
      setControl('adjustment', 3);
      component.finishTrigger();

      expect(component.currentPolicy.scaling_rules_form[0].adjustment).toBe(adjustment);
    });
  });

  describe('durations', () => {
    beforeEach(() => {
      create();
      component.addTrigger();
    });

    it.each(['breach_duration_secs', 'cool_down_secs'] as const)('accepts %s from 60 to 3600 seconds', (name) => {
      expect(setControl(name, 59).hasError('min')).toBe(true);
      expect(setControl(name, 60).valid).toBe(true);
      expect(setControl(name, 3600).valid).toBe(true);
      expect(setControl(name, 3601).hasError('max')).toBe(true);
    });
  });

  describe('step', () => {
    beforeEach(() => {
      create();
      component.addTrigger();
    });

    // A step in instances can be at most instance_max_count - 1 (here 9).
    it('limits a step in instances by the maximum instance count', () => {
      setControl('adjustment_type', 'value');

      expect(setControl('adjustment', 9).valid).toBe(true);
      expect(setControl('adjustment', 10).hasError('alertInvalidPolicyTriggerStepRange')).toBe(true);
      expect(setControl('adjustment', 0).valid).toBe(false);
    });

    // A percentage step has no upper limit, and switching the type must
    // re-check a step the user already entered.
    it('lifts the limit when the step is a percentage', () => {
      setControl('adjustment_type', 'value');
      const adjustment = setControl('adjustment', 150);
      expect(adjustment.hasError('alertInvalidPolicyTriggerStepRange')).toBe(true);

      setControl('adjustment_type', 'percentage');
      expect(adjustment.valid).toBe(true);
    });
  });

  describe('metric type', () => {
    beforeEach(() => {
      create();
      component.addTrigger();
    });

    it('accepts a custom metric name of letters, digits and underscores', () => {
      expect(setControl('metric_type', 'queue_length_2').valid).toBe(true);
      expect(setControl('metric_type', 'queue-length').hasError('alertInvalidPolicyTriggerMetricName')).toBe(true);
      expect(setControl('metric_type', '').hasError('required')).toBe(true);
    });
  });

  // The unit is fixed per metric by the autoscaler; the form must not
  // offer a field for it.
  describe('unit', () => {
    it('has no unit control in the form or the rendered edit row', () => {
      create();
      component.addTrigger();
      fixture.componentRef.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      expect(Object.keys(component.editTriggerForm.controls)).not.toContain('unit');
      const form: HTMLElement | null = fixture.nativeElement.querySelector('form');
      expect(form).not.toBeNull();
      expect(form!.querySelector('[name="unit"], [formcontrolname="unit"]')).toBeNull();
    });

    it('shows the fixed unit for the metric', () => {
      create();
      expect(component.getMetricUnit('memoryused')).toBe('MB');
      expect(component.getMetricUnit('cpuutil')).toBe(' % ');
      expect(component.getMetricUnit('custom_metric')).toBe('');
    });
  });
});
