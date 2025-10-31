import intersect from 'intersect';
import { isAfter, isEqual, parse } from 'date-fns';

import { AppRecurringSchedule, AppScalingRule, AppSpecificDate } from '../../store/app-autoscaler.types';
import { AutoscalerConstants } from './autoscaler-util';

export function numberWithFractionOrExceedRange(value: number | string | null | undefined, min: number, max: number, required: boolean) {
  if ((!value || isNaN(Number(value))) && !required) {
    return false;
  }
  if ((!value || isNaN(Number(value))) && required) {
    return true;
  }
  const numValue = Number(value);
  return value.toString().indexOf('.') > -1 || numValue > max || numValue < min;
}

export function timeIsSameOrAfter(startTime: string, endTime: string) {
  const startTimeDate = parse('2000-01-01T' + startTime, AutoscalerConstants.MomentFormateDateTimeT, new Date());
  const endTimeDate = parse('2000-01-01T' + endTime, AutoscalerConstants.MomentFormateDateTimeT, new Date());
  return isAfter(startTimeDate, endTimeDate) || isEqual(startTimeDate, endTimeDate);
}

export function dateIsAfter(startDate: string, endDate: string) {
  const startDateParsed = parse(startDate, AutoscalerConstants.MomentFormateDate, new Date());
  const endDateParsed = parse(endDate, AutoscalerConstants.MomentFormateDate, new Date());
  return isAfter(startDateParsed, endDateParsed);
}

export function dateTimeIsSameOrAfter(startDateTime: string, endDateTime: string) {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  return isAfter(start, end) || isEqual(start, end);
}

export function recurringSchedulesInvalidRepeatOn(inputRecurringSchedules: AppRecurringSchedule) {
  const weekdayCount = inputRecurringSchedules.hasOwnProperty('days_of_week') ? inputRecurringSchedules.days_of_week.length : 0;
  const monthdayCount = inputRecurringSchedules.hasOwnProperty('days_of_month') ? inputRecurringSchedules.days_of_month.length : 0;
  return (weekdayCount > 0 && monthdayCount > 0) || (weekdayCount === 0 && monthdayCount === 0);
}

export function recurringSchedulesOverlapping(
  newSchedule: AppRecurringSchedule, index: number,
  inputRecurringSchedules: AppRecurringSchedule[], property: 'days_of_week' | 'days_of_month'): boolean {
  if (!inputRecurringSchedules) {
    return false;
  }
  const overlappingSchedule = inputRecurringSchedules.find((value, i) => {
    if (index === i || !inputRecurringSchedules[i].hasOwnProperty(property) ||
      inputRecurringSchedules[i].start_date && newSchedule.start_date && !dateOverlaps(inputRecurringSchedules[i], newSchedule)) {
      return false;
    }
    if (timeOverlaps(inputRecurringSchedules[i], newSchedule)) {
      const scheduleProperty = inputRecurringSchedules[i][property] as number[] | undefined;
      const newScheduleProperty = newSchedule[property] as number[] | undefined;
      if (scheduleProperty && newScheduleProperty) {
        const intersects = intersect(scheduleProperty, newScheduleProperty);
        return intersects.length > 0;
      }
    }
    return false;
  });
  return !!overlappingSchedule;
}

export function specificDateRangeOverlapping(newSchedule: AppSpecificDate, index: number, inputSpecificDates: AppSpecificDate[]): boolean {
  const start = parse(newSchedule.start_date_time, AutoscalerConstants.MomentFormateDateTimeT, new Date());
  const end = parse(newSchedule.end_date_time, AutoscalerConstants.MomentFormateDateTimeT, new Date());
  if (inputSpecificDates) {
    const dateRangeList = inputSpecificDates.map((value, i) => {
      if (i !== index) {
        const starti = parse(value.start_date_time, AutoscalerConstants.MomentFormateDateTimeT, new Date());
        const endi = parse(value.end_date_time, AutoscalerConstants.MomentFormateDateTimeT, new Date());
        return {
          start: starti,
          end: endi
        };
      }
      return undefined;
    });
    const overlappingSchedule = dateRangeList.find((item) => {
      if (item && dateTimeOverlaps(start, end, item.start, item.end)) {
        return true;
      }
      return false;
    });
    return !!overlappingSchedule;
  } else {
    return false;
  }
}

function timeOverlaps(timeI: AppRecurringSchedule, tiemJ: AppRecurringSchedule): boolean {
  const startDateTimeI = parse('1970-01-01T' + timeI.start_time, AutoscalerConstants.MomentFormateDateTimeT, new Date());
  const endDateTimeI = parse('1970-01-01T' + timeI.end_time, AutoscalerConstants.MomentFormateDateTimeT, new Date());
  const startDateTimeJ = parse('1970-01-01T' + tiemJ.start_time, AutoscalerConstants.MomentFormateDateTimeT, new Date());
  const endDateTimeJ = parse('1970-01-01T' + tiemJ.end_time, AutoscalerConstants.MomentFormateDateTimeT, new Date());
  return dateTimeOverlaps(startDateTimeI, endDateTimeI, startDateTimeJ, endDateTimeJ);
}

function dateOverlaps(dateI: AppRecurringSchedule, dateJ: AppRecurringSchedule): boolean {
  const startDateTimeI = parse(dateI.start_date + 'T00:00', AutoscalerConstants.MomentFormateDateTimeT, new Date());
  const endDateTimeI = parse(dateI.end_date + 'T23:59', AutoscalerConstants.MomentFormateDateTimeT, new Date());
  const startDateTimeJ = parse(dateJ.start_date + 'T00:00', AutoscalerConstants.MomentFormateDateTimeT, new Date());
  const endDateTimeJ = parse(dateJ.end_date + 'T23:59', AutoscalerConstants.MomentFormateDateTimeT, new Date());
  return dateTimeOverlaps(startDateTimeI, endDateTimeI, startDateTimeJ, endDateTimeJ);
}

function dateTimeOverlaps(
  startDateTimeI: Date, endDateTimeI: Date,
  startDateTimeJ: Date, endDateTimeJ: Date): boolean {
  if (isAfter(startDateTimeJ, startDateTimeI)) {
    return isAfter(endDateTimeI, startDateTimeJ);
  } else {
    return isAfter(endDateTimeJ, startDateTimeI);
  }
}

export function getThresholdMin(policyTriggers: AppScalingRule[], metricType: string, scaleType: string, index: number): number {
  if (scaleType === 'upper') {
    return policyTriggers.reduce((thresholdMin, trigger, triggerIndex) => {
      if (triggerIndex !== index && trigger.metric_type === metricType &&
        AutoscalerConstants.LowerOperators.indexOf(trigger.operator) >= 0) {
        return Math.max(trigger.threshold + 1, thresholdMin);
      } else {
        return thresholdMin;
      }
    }, 1);
  } else {
    return 1;
  }
}

export function getThresholdMax(policyTriggers: AppScalingRule[], metricType: string, scaleType: string, index: number): number {
  if (scaleType === 'lower') {
    return policyTriggers.reduce((thresholdMax, trigger, triggerIndex) => {
      if (triggerIndex !== index && trigger.metric_type === metricType &&
        AutoscalerConstants.UpperOperators.indexOf(trigger.operator) >= 0) {
        return Math.min(trigger.threshold - 1, thresholdMax);
      } else {
        return thresholdMax;
      }
    }, Number.MAX_VALUE);
  } else {
    return Number.MAX_VALUE;
  }
}

export function inValidMetricType(metricType: string): boolean {
  const metricTypePattern = new RegExp('^[a-zA-Z0-9_]+$');
  return !metricTypePattern.test(metricType);
}
