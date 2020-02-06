import { AppRecurringSchedule, AppSpecificDate } from '../../store/app-autoscaler.types';
import {
  dateIsAfter,
  dateTimeIsSameOrAfter,
  numberWithFractionOrExceedRange,
  recurringSchedulesInvalidRepeatOn,
  recurringSchedulesOverlapping,
  specificDateRangeOverlapping,
  timeIsSameOrAfter,
} from './autoscaler-validation';

describe('Autoscaler Util Helper', () => {
  it('numberWithFractionOrExceedRange', () => {
    expect(numberWithFractionOrExceedRange(undefined, 1, 10, false)).toBe(false);
    expect(numberWithFractionOrExceedRange(undefined, 1, 10, true)).toBe(true);
    expect(numberWithFractionOrExceedRange(5, 1, 10, true)).toBe(false);
    expect(numberWithFractionOrExceedRange(1, 5, 10, true)).toBe(true);
  });
  it('timeIsSameOrAfter', () => {
    expect(timeIsSameOrAfter('10:00', '12:00')).toBe(false);
    expect(timeIsSameOrAfter('10:00', '10:00')).toBe(true);
    expect(timeIsSameOrAfter('10:00', '08:00')).toBe(true);
  });
  it('dateIsAfter', () => {
    expect(dateIsAfter('2020-01-01', '2020-01-02')).toBe(false);
    expect(dateIsAfter('2020-01-01', '2020-01-01')).toBe(false);
    expect(dateIsAfter('2020-01-01', '2019-12-31')).toBe(true);
  });
  it('dateTimeIsSameOrAfter', () => {
    expect(dateTimeIsSameOrAfter('2020-01-01 10:00', '2020-01-01 12:00')).toBe(false);
    expect(dateTimeIsSameOrAfter('2020-01-01 10:00', '2020-01-01 10:00')).toBe(true);
    expect(dateTimeIsSameOrAfter('2020-01-01 10:00', '2020-01-01 08:00')).toBe(true);
  });
  it('recurringSchedulesInvalidRepeatOn', () => {
    const recurring1: AppRecurringSchedule = {
      days_of_month: [1, 2],
      days_of_week: [3, 4],
      instance_min_count: 1,
      instance_max_count: 2,
      start_time: '10:00',
      end_time: '18:00'
    };
    const recurring2: AppRecurringSchedule = {
      days_of_week: [3, 4],
      instance_min_count: 1,
      instance_max_count: 2,
      start_time: '10:00',
      end_time: '18:00'
    };
    const recurring3: AppRecurringSchedule = {
      days_of_month: [1, 2],
      instance_min_count: 1,
      instance_max_count: 2,
      start_time: '10:00',
      end_time: '18:00'
    };
    const recurring4: AppRecurringSchedule = {
      instance_min_count: 1,
      instance_max_count: 2,
      start_time: '10:00',
      end_time: '18:00'
    };
    expect(recurringSchedulesInvalidRepeatOn(recurring1)).toBe(true);
    expect(recurringSchedulesInvalidRepeatOn(recurring2)).toBe(false);
    expect(recurringSchedulesInvalidRepeatOn(recurring3)).toBe(false);
    expect(recurringSchedulesInvalidRepeatOn(recurring4)).toBe(true);
  });
  it('recurringSchedulesOverlapping', () => {
    const recurring1: AppRecurringSchedule = {
      days_of_week: [1, 2],
      instance_min_count: 1,
      instance_max_count: 2,
      start_time: '10:00',
      end_time: '18:00'
    };
    const recurring2: AppRecurringSchedule = {
      days_of_month: [3, 4],
      instance_min_count: 1,
      instance_max_count: 2,
      start_time: '10:00',
      end_time: '18:00'
    };
    const recurrings: AppRecurringSchedule[] = [{
      days_of_month: [4, 5],
      instance_min_count: 1,
      instance_max_count: 2,
      start_time: '10:00',
      end_time: '18:00'
    }, recurring1, recurring2];
    expect(recurringSchedulesOverlapping(recurring1, 1, recurrings, 'days_of_week')).toBe(false);
    expect(recurringSchedulesOverlapping(recurring2, 2, recurrings, 'days_of_month')).toBe(true);
  });
  it('specificDateRangeOverlapping', () => {
    const specific: AppSpecificDate = {
      instance_min_count: 1,
      instance_max_count: 2,
      start_date_time: '2020-01-01T10:00',
      end_date_time: '2020-01-01T20:00'
    };
    const specifics1: AppSpecificDate[] = [{
      instance_min_count: 1,
      instance_max_count: 2,
      start_date_time: '2020-01-01T08:00',
      end_date_time: '2020-01-01T18:00'
    }, specific];
    const specifics2: AppSpecificDate[] = [{
      instance_min_count: 1,
      instance_max_count: 2,
      start_date_time: '2020-02-01T08:00',
      end_date_time: '2020-02-01T18:00'
    }, specific];
    expect(specificDateRangeOverlapping(specific, 1, specifics1)).toBe(true);
    expect(specificDateRangeOverlapping(specific, 1, specifics2)).toBe(false);
  });
});
