import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { addDays, format } from 'date-fns';
import { ApplicationService } from '@stratosui/cloud-foundry';
import { createEmptyStoreModule } from '@stratosui/store/testing';
import { ApplicationServiceMock } from '@test-framework/cf';
import { TabNavService } from '@stratosui/core';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { autoscalerTransformArrayToMap } from '../../../core/autoscaler-helpers/autoscaler-transform-policy';
import { AutoscalerConstants } from '../../../core/autoscaler-helpers/autoscaler-util';
import { AppRecurringSchedule } from '../../../store/app-autoscaler.types';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';
import { EditAutoscalerPolicyStep3Component } from './edit-autoscaler-policy-step3.component';

const day = (offset: number) => format(addDays(new Date(), offset), AutoscalerConstants.MomentFormateDate);

describe('EditAutoscalerPolicyStep3Component', () => {
  let component: EditAutoscalerPolicyStep3Component;
  let fixture: ComponentFixture<EditAutoscalerPolicyStep3Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditAutoscalerPolicyStep3Component,
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
  function create(recurring: AppRecurringSchedule[] = []) {
    TestBed.inject(EditAutoscalerPolicyService).setState(autoscalerTransformArrayToMap({
      instance_min_count: 1,
      instance_max_count: 10,
      scaling_rules: [],
      schedules: { timezone: 'UTC', recurring_schedule: recurring, specific_date: [] },
    }));
    fixture = TestBed.createComponent(EditAutoscalerPolicyStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const schedules = () => component.currentPolicy.schedules!.recurring_schedule!;
  const controls = () => component.editRecurringScheduleForm.controls;
  function setControl(name: keyof ReturnType<typeof controls>, value: unknown) {
    const control = controls()[name];
    control.setValue(value as never);
    return control;
  }

  const weekly = (overrides: Partial<AppRecurringSchedule> = {}): AppRecurringSchedule => ({
    start_time: '10:00',
    end_time: '18:00',
    days_of_week: [1],
    instance_min_count: 1,
    instance_max_count: 5,
    ...overrides,
  });

  it('should be created', () => {
    create();
    expect(component).toBeTruthy();
  });

  describe('schedule list', () => {
    // The form holds days 0-based (option index); the policy holds them
    // 1-based, as the autoscaler expects.
    it('adds the default schedule and puts its row in edit mode', () => {
      create();
      component.addRecurringSchedule();

      expect(schedules()).toHaveLength(1);
      expect(component.editIndex).toBe(0);
      expect(component.editRecurringScheduleForm.getRawValue()).toEqual({
        days_of_week: [0, 1, 2],
        days_of_month: [],
        instance_min_count: 1,
        instance_max_count: 10,
        initial_min_instance_count: 5,
        start_date: '',
        end_date: '',
        start_time: '10:00',
        end_time: '18:00',
        effective_type: 'always',
        repeat_type: 'week',
      });
    });

    it('writes a weekly schedule back on confirm and leaves edit mode', () => {
      create();
      component.addRecurringSchedule();
      setControl('days_of_week', [4, 5]);
      setControl('start_time', '08:00');
      setControl('end_time', '12:00');
      setControl('instance_min_count', 2);
      setControl('instance_max_count', 4);
      setControl('initial_min_instance_count', 0);
      component.finishRecurringSchedule();

      expect(component.editIndex).toBe(-1);
      // An empty initial count is dropped rather than sent as 0.
      expect(schedules()[0]).toEqual({
        start_time: '08:00',
        end_time: '12:00',
        days_of_week: [5, 6],
        instance_min_count: 2,
        instance_max_count: 4,
      });
    });

    // Switching a schedule to monthly must drop its weekdays, or the
    // autoscaler rejects a schedule with both.
    it('writes a monthly schedule without weekdays', () => {
      create();
      component.addRecurringSchedule();
      setControl('repeat_type', 'month');
      setControl('days_of_month', [0, 14]);
      component.finishRecurringSchedule();

      expect(schedules()[0].days_of_month).toEqual([1, 15]);
      expect(schedules()[0]).not.toHaveProperty('days_of_week');
    });

    it('keeps the custom date range only for a custom effective period', () => {
      create();
      component.addRecurringSchedule();
      setControl('effective_type', 'custom');
      component.resetEffectiveType('custom');

      // Choosing a custom period fills in tomorrow as both dates.
      expect(controls().start_date.value).toBe(day(1));
      expect(controls().end_date.value).toBe(day(1));

      setControl('end_date', day(3));
      component.finishRecurringSchedule();
      expect(schedules()[0]).toMatchObject({ start_date: day(1), end_date: day(3) });

      component.editRecurringSchedule(0);
      setControl('effective_type', 'always');
      component.resetEffectiveType('always');
      component.finishRecurringSchedule();
      expect(schedules()[0]).not.toHaveProperty('start_date');
      expect(schedules()[0]).not.toHaveProperty('end_date');
    });

    it('loads an existing monthly custom schedule for editing', () => {
      create([weekly({
        days_of_week: undefined, days_of_month: [1, 31], start_date: day(2), end_date: day(9), initial_min_instance_count: 3,
      })]);
      component.editRecurringSchedule(0);

      expect(component.editRecurringScheduleForm.getRawValue()).toMatchObject({
        days_of_week: [],
        days_of_month: [0, 30],
        start_date: day(2),
        end_date: day(9),
        initial_min_instance_count: 3,
        effective_type: 'custom',
        repeat_type: 'month',
      });
    });

    // The default is a shared constant; confirming a new row must not
    // change the days offered for the next one.
    it('does not change the default schedule', () => {
      create();
      component.addRecurringSchedule();
      setControl('days_of_week', [6]);
      component.finishRecurringSchedule();

      expect(AutoscalerConstants.PolicyDefaultRecurringSchedule.days_of_week).toEqual([1, 2, 3]);
    });

    it('removes a schedule and leaves edit mode when it was being edited', () => {
      create([weekly({ days_of_week: [1] }), weekly({ days_of_week: [2] })]);
      component.editRecurringSchedule(0);
      component.removeRecurringSchedule(0);

      expect(component.editIndex).toBe(-1);
      expect(schedules().map(s => s.days_of_week)).toEqual([[2]]);
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      create();
      component.addRecurringSchedule();
    });

    // Both time fields carry the error so either one can be fixed.
    it('requires the start time before the end time', () => {
      setControl('start_time', '18:00');
      expect(controls().start_time.hasError('alertInvalidPolicyScheduleEndTimeBeforeStartTime')).toBe(true);
      expect(controls().end_time.hasError('alertInvalidPolicyScheduleEndTimeBeforeStartTime')).toBe(true);

      setControl('start_time', '09:00');
      expect(controls().start_time.valid).toBe(true);
      expect(controls().end_time.valid).toBe(true);
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

      expect(setControl('instance_min_count', 0).hasError('alertInvalidPolicyMinimumRange')).toBe(true);
      expect(setControl('instance_min_count', 1.5).hasError('alertInvalidPolicyMinimumRange')).toBe(true);
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

    it('requires a custom start date no later than the end date', () => {
      setControl('effective_type', 'custom');
      component.resetEffectiveType('custom');

      setControl('start_date', day(5));
      setControl('end_date', day(4));
      expect(controls().end_date.hasError('alertInvalidPolicyScheduleEndDateBeforeStartDate')).toBe(true);

      setControl('end_date', day(5));
      expect(controls().start_date.valid).toBe(true);
      expect(controls().end_date.valid).toBe(true);
    });

    it('rejects a custom date in the past', () => {
      setControl('effective_type', 'custom');
      component.resetEffectiveType('custom');

      expect(setControl('start_date', day(-1)).hasError('alertInvalidPolicyScheduleDateBeforeNow')).toBe(true);
      expect(setControl('start_date', day(0)).hasError('alertInvalidPolicyScheduleDateBeforeNow')).toBe(false);
    });

    it('ignores the dates when the schedule is always effective', () => {
      setControl('start_date', day(-10));
      expect(controls().start_date.valid).toBe(true);
    });

    // Only the selected repeat kind is required; the other list is unused.
    it('requires days for the selected repeat kind only', () => {
      expect(setControl('days_of_week', []).hasError('required')).toBe(true);

      setControl('repeat_type', 'month');
      expect(controls().days_of_month.hasError('required')).toBe(true);
      expect(controls().days_of_week.errors).toBeNull();

      expect(setControl('days_of_month', [0]).valid).toBe(true);
    });
  });

  describe('overlap', () => {
    it('rejects weekdays that overlap another weekly schedule in time', () => {
      create([weekly({ days_of_week: [1] })]);
      component.addRecurringSchedule();

      expect(setControl('days_of_week', [0]).hasError('alertInvalidPolicyScheduleRecurringConflict')).toBe(true);
      expect(setControl('days_of_week', [4]).valid).toBe(true);
    });

    // Back-to-back time ranges on the same day do not overlap.
    it('accepts the same weekday at a later time', () => {
      create([weekly({ days_of_week: [1] })]);
      component.addRecurringSchedule();
      setControl('days_of_week', [0]);
      setControl('end_time', '20:00');
      setControl('start_time', '18:00');

      expect(controls().days_of_week.valid).toBe(true);
    });

    // Weekly and monthly schedules are compared only with their own kind.
    it('does not compare a weekly schedule with a monthly one', () => {
      create([weekly({ days_of_week: undefined, days_of_month: [1, 2, 3] })]);
      component.addRecurringSchedule();

      expect(setControl('days_of_week', [0, 1, 2]).valid).toBe(true);
    });

    it('accepts an overlapping weekday when the custom date ranges do not meet', () => {
      create([weekly({ days_of_week: [1], start_date: day(1), end_date: day(2) })]);
      component.addRecurringSchedule();
      setControl('effective_type', 'custom');
      component.resetEffectiveType('custom');
      setControl('end_date', day(10));
      setControl('start_date', day(5));

      expect(setControl('days_of_week', [0]).valid).toBe(true);
    });
  });
});
