import { readFileSync } from 'fs';
import { join } from 'path';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { addDays, format, setHours, setMinutes } from 'date-fns';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { createEmptyStoreModule } from '@stratosui/store/testing';
import { ApplicationService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import { TabNavService } from '@stratosui/core';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { autoscalerTransformArrayToMap } from '../../../core/autoscaler-helpers/autoscaler-transform-policy';
import { AutoscalerConstants, PolicyAlert } from '../../../core/autoscaler-helpers/autoscaler-util';
import { AutoscalerPolicyDataService } from '../../../services/domain-data/autoscaler-policy-data.service';
import { AppScalingRule, AppSpecificDate } from '../../../store/app-autoscaler.types';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';
import { EditAutoscalerPolicyStep4Component } from './edit-autoscaler-policy-step4.component';

// Whole days away from now, so the "before now" checks do not depend on
// the clock or the time zone the tests run in.
const at = (dayOffset: number, hour: number) =>
  format(setMinutes(setHours(addDays(new Date(), dayOffset), hour), 0), AutoscalerConstants.MomentFormateDateTimeT);

describe('EditAutoscalerPolicyStep4Component', () => {
  let component: EditAutoscalerPolicyStep4Component;
  let fixture: ComponentFixture<EditAutoscalerPolicyStep4Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditAutoscalerPolicyStep4Component,
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
  function create(specific: AppSpecificDate[] = [], scalingRules: AppScalingRule[] = []) {
    TestBed.inject(EditAutoscalerPolicyService).setState(autoscalerTransformArrayToMap({
      instance_min_count: 1,
      instance_max_count: 10,
      scaling_rules: scalingRules,
      schedules: { timezone: 'UTC', recurring_schedule: [], specific_date: specific },
    }));
    fixture = TestBed.createComponent(EditAutoscalerPolicyStep4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const dates = () => component.currentPolicy.schedules!.specific_date!;
  const controls = () => component.editSpecificDateForm.controls;
  function setControl(name: keyof ReturnType<typeof controls>, value: unknown) {
    const control = controls()[name];
    control.setValue(value as never);
    return control;
  }

  const specific = (overrides: Partial<AppSpecificDate> = {}): AppSpecificDate => ({
    start_date_time: at(3, 10),
    end_date_time: at(3, 18),
    instance_min_count: 2,
    instance_max_count: 6,
    ...overrides,
  });

  it('should be created', () => {
    create();
    expect(component).toBeTruthy();
  });

  describe('schedule list', () => {
    it('adds the default schedule and puts its row in edit mode', () => {
      create();
      component.addSpecificDate();

      expect(dates()).toHaveLength(1);
      expect(component.editIndex).toBe(0);
      expect(component.editSpecificDateForm.getRawValue()).toEqual({
        instance_min_count: 1,
        instance_max_count: 10,
        initial_min_instance_count: 5,
        start_date_time: AutoscalerConstants.PolicyDefaultSpecificDate.start_date_time,
        end_date_time: AutoscalerConstants.PolicyDefaultSpecificDate.end_date_time,
      });
    });

    it('writes the form back on confirm and leaves edit mode', () => {
      create();
      component.addSpecificDate();
      setControl('end_date_time', at(4, 18));
      setControl('start_date_time', at(4, 8));
      setControl('instance_max_count', 8);
      setControl('instance_min_count', 3);
      setControl('initial_min_instance_count', 0);
      component.finishSpecificDate();

      expect(component.editIndex).toBe(-1);
      // An empty initial count is dropped rather than sent as 0.
      expect(dates()[0]).toEqual({
        start_date_time: at(4, 8),
        end_date_time: at(4, 18),
        instance_min_count: 3,
        instance_max_count: 8,
      });
    });

    it('loads an existing schedule for editing', () => {
      create([specific({ initial_min_instance_count: 4 })]);
      component.editSpecificDate(0);

      expect(component.editIndex).toBe(0);
      expect(component.editSpecificDateForm.getRawValue()).toEqual({
        instance_min_count: 2,
        instance_max_count: 6,
        initial_min_instance_count: 4,
        start_date_time: at(3, 10),
        end_date_time: at(3, 18),
      });
    });

    it('removes a schedule and leaves edit mode when it was being edited', () => {
      create([specific(), specific({ start_date_time: at(5, 10), end_date_time: at(5, 18) })]);
      component.editSpecificDate(1);
      component.removeSpecificDate(1);

      expect(component.editIndex).toBe(-1);
      expect(dates()).toEqual([specific()]);
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      create([specific()]);
      component.addSpecificDate();
      // Move the new row clear of the existing schedule.
      setControl('end_date_time', at(6, 18));
      setControl('start_date_time', at(6, 10));
    });

    it('starts from a valid row', () => {
      expect(component.editSpecificDateForm.valid).toBe(true);
    });

    // Both fields carry the error so either one can be fixed.
    it('requires the start before the end', () => {
      setControl('start_date_time', at(6, 18));
      expect(controls().start_date_time.hasError('alertInvalidPolicyScheduleEndDateTimeBeforeStartDateTime')).toBe(true);
      expect(controls().end_date_time.hasError('alertInvalidPolicyScheduleEndDateTimeBeforeStartDateTime')).toBe(true);

      setControl('start_date_time', at(6, 9));
      expect(controls().start_date_time.valid).toBe(true);
      expect(controls().end_date_time.valid).toBe(true);
    });

    it('rejects a start or end in the past', () => {
      expect(setControl('start_date_time', at(-2, 10)).hasError('alertInvalidPolicyScheduleStartDateTimeBeforeNow')).toBe(true);
      expect(setControl('end_date_time', at(-2, 18)).hasError('alertInvalidPolicyScheduleEndDateTimeBeforeNow')).toBe(true);
    });

    it('rejects a range that overlaps another specific date', () => {
      setControl('start_date_time', at(3, 12));
      expect(controls().start_date_time.hasError('alertInvalidPolicyScheduleSpecificConflict')).toBe(true);

      setControl('start_date_time', at(6, 10));
      expect(controls().start_date_time.valid).toBe(true);
    });

    // A schedule must not conflict with itself while it is being edited.
    it('ignores the edited schedule when checking overlap', () => {
      component.finishSpecificDate();
      component.editSpecificDate(1);
      setControl('start_date_time', at(6, 11));

      expect(controls().start_date_time.valid).toBe(true);
    });

    it('allows the minimum count up to the maximum count', () => {
      setControl('instance_max_count', 4);
      expect(setControl('instance_min_count', 4).valid).toBe(true);
      expect(controls().instance_max_count.valid).toBe(true);

      expect(setControl('instance_min_count', 5).hasError('alertInvalidPolicyMinimumRange')).toBe(true);
      expect(controls().instance_max_count.hasError('alertInvalidPolicyMaximumRange')).toBe(true);

      setControl('instance_max_count', 6);
      expect(controls().instance_min_count.valid).toBe(true);
      expect(controls().instance_max_count.valid).toBe(true);
    });

    it('accepts an empty initial count or one within the limits', () => {
      setControl('instance_min_count', 2);
      setControl('instance_max_count', 6);

      expect(setControl('initial_min_instance_count', 0).valid).toBe(true);
      expect(setControl('initial_min_instance_count', 2).valid).toBe(true);
      expect(setControl('initial_min_instance_count', 6).valid).toBe(true);
      expect(setControl('initial_min_instance_count', 1).hasError('alertInvalidPolicyInitialMaximumRange')).toBe(true);
    });

    // The autoscaler rejects an initial count above the maximum; the form
    // must not let one through.
    it('rejects an initial count above the maximum count', () => {
      setControl('instance_min_count', 2);
      setControl('instance_max_count', 6);

      expect(setControl('initial_min_instance_count', 7).hasError('alertInvalidPolicyInitialMaximumRange')).toBe(true);
    });
  });

  describe('updatePolicy', () => {
    const scalingRule: AppScalingRule = {
      metric_type: 'cpu', operator: '>', threshold: 80, adjustment: '+1', breach_duration_secs: 120, cool_down_secs: 300,
    };

    function spyOnUpdate() {
      return vi.spyOn(TestBed.inject(AutoscalerPolicyDataService), 'update');
    }

    it('saves the edited policy for the current app', async () => {
      const update = spyOnUpdate().mockResolvedValue(undefined);
      create([], [scalingRule]);
      component.addSpecificDate();
      component.finishSpecificDate();

      const result = await firstValueFrom(component.updatePolicy(3, null as never));

      expect(update).toHaveBeenCalledWith(ApplicationServiceMock.cfGuid, ApplicationServiceMock.appGuid, component.currentPolicy);
      const sent = update.mock.calls[0][2];
      expect(sent.scaling_rules_form).toEqual([scalingRule]);
      expect(sent.schedules!.specific_date).toHaveLength(1);
      expect(result).toEqual({ success: true, redirect: true, message: undefined });
    });

    // The autoscaler rejects a policy with no rules and no schedules;
    // say so without a request.
    it('refuses an empty policy without saving', async () => {
      const update = spyOnUpdate();
      create();

      const result = await firstValueFrom(component.updatePolicy(3, null as never));

      expect(update).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toBe(`Could not update policy: ${PolicyAlert.alertInvalidPolicyTriggerScheduleEmpty}`);
    });

    it('reports a failed save and stays on the step', async () => {
      spyOnUpdate().mockRejectedValue(new Error('network down'));
      create([specific()]);

      const result = await firstValueFrom(component.updatePolicy(3, null as never));

      expect(result).toEqual({
        success: false,
        redirect: false,
        message: 'Could not update policy: network down',
        messagePieces: [{ text: 'Could not update policy: network down', style: 'text' }],
      });
    });

    // A rejected policy comes back as an HTTP error whose own message only
    // names the URL and status; the user needs the autoscaler's reason.
    it('reports the autoscaler reason for a rejected policy', async () => {
      spyOnUpdate().mockRejectedValue(new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        url: '/pp/v1/autoscaler/apps/mockAppGuid/policy',
        error: [{ context: '(root).instance_min_count', description: 'Must be greater than or equal to 1' }],
      }));
      create([specific()]);

      const result = await firstValueFrom(component.updatePolicy(3, null as never));

      expect(result.success).toBe(false);
      expect(result.message).toBe('Could not update policy: instance_min_count: Must be greater than or equal to 1');
    });

    // nginx's own 502 page, as a proxy in front of the autoscaler sends it.
    it('keeps an error page\'s heading after its lead-in', async () => {
      const page = readFileSync(join(import.meta.dirname, '../../../../../store/src/testdata/upstream-errors/nginx-502.body'), 'utf8');
      spyOnUpdate().mockRejectedValue(new HttpErrorResponse({ error: page, status: 502, statusText: 'Bad Gateway' }));
      create([specific()]);

      const result = await firstValueFrom(component.updatePolicy(3, null as never));

      expect(result.success).toBe(false);
      expect(result.message).toBe('Could not update policy: 502 Bad Gateway\nnginx/1.28.0');
      expect(result.messagePieces).toEqual([
        { text: 'Could not update policy: ', style: 'text' },
        { text: '502 Bad Gateway', style: 'heading' },
        { text: '\nnginx/1.28.0', style: 'text' },
      ]);
    });

    it('says create when the policy is new', async () => {
      TestBed.overrideProvider(ActivatedRoute, { useValue: { snapshot: { queryParams: { create: true } } } });
      spyOnUpdate().mockRejectedValue(new Error('network down'));
      create([specific()]);

      const result = await firstValueFrom(component.updatePolicy(3, null as never));

      expect(result.message).toBe('Could not create policy: network down');
    });
  });
});
