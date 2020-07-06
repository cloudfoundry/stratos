import * as intersect from 'intersect';
import * as moment from 'moment-timezone';

import { AppRecurringSchedule, AppScalingRule, AppSpecificDate } from '../../store/app-autoscaler.types';
import { AutoscalerConstants } from './autoscaler-util';

export function numberWithFractionOrExceedRange(value: any, min: number, max: number, required: boolean) {
  if ((!value || isNaN(value)) && !required) {
    return false;
  }
  if ((!value || isNaN(value)) && required) {
    return true;
  }
  return value.toString().indexOf('.') > -1 || value > max || value < min;
}

export function timeIsSameOrAfter(startTime: string, endTime: string) {
  const startTimeMoment = moment('2000-01-01T' + startTime, AutoscalerConstants.MomentFormateDateTimeT);
  const endTimeMoment = moment('2000-01-01T' + endTime, AutoscalerConstants.MomentFormateDateTimeT);
  return startTimeMoment.isSameOrAfter(endTimeMoment);
}

export function dateIsAfter(startDate: string, endDate: string) {
  return moment(startDate, AutoscalerConstants.MomentFormateDate).isAfter(moment(endDate, AutoscalerConstants.MomentFormateDate));
}

export function dateTimeIsSameOrAfter(startDateTime: string, endDateTime: string) {
  return moment(startDateTime).isSameOrAfter(moment(endDateTime));
}

export function recurringSchedulesInvalidRepeatOn(inputRecurringSchedules: AppRecurringSchedule) {
  const weekdayCount = inputRecurringSchedules.hasOwnProperty('days_of_week') ? inputRecurringSchedules.days_of_week.length : 0;
  const monthdayCount = inputRecurringSchedules.hasOwnProperty('days_of_month') ? inputRecurringSchedules.days_of_month.length : 0;
  return (weekdayCount > 0 && monthdayCount > 0) || (weekdayCount === 0 && monthdayCount === 0);
}

export function recurringSchedulesOverlapping(
  newSchedule: AppRecurringSchedule, index: number,
  inputRecurringSchedules: AppRecurringSchedule[], property: string) {
  if (!inputRecurringSchedules) {
    return false;
  }
  const overlappingSchedule = inputRecurringSchedules.find((value, i) => {
    if (index === i || !inputRecurringSchedules[i].hasOwnProperty(property) ||
      inputRecurringSchedules[i].start_date && newSchedule.start_date && !dateOverlaps(inputRecurringSchedules[i], newSchedule)) {
      return false;
    }
    if (timeOverlaps(inputRecurringSchedules[i], newSchedule)) {
      const intersects = intersect(inputRecurringSchedules[i][property], newSchedule[property]);
      return intersects.length > 0;
    }
  });
  return !!overlappingSchedule;
}

export function specificDateRangeOverlapping(newSchedule: AppSpecificDate, index: number, inputSpecificDates: AppSpecificDate[]) {
  const start = moment(newSchedule.start_date_time, AutoscalerConstants.MomentFormateDateTimeT);
  const end = moment(newSchedule.end_date_time, AutoscalerConstants.MomentFormateDateTimeT);
  if (inputSpecificDates) {
    const dateRangeList = inputSpecificDates.map((value, i) => {
      if (i !== index) {
        const starti = moment(value.start_date_time, AutoscalerConstants.MomentFormateDateTimeT);
        const endi = moment(value.end_date_time, AutoscalerConstants.MomentFormateDateTimeT);
        return {
          start: starti,
          end: endi
        };
      }
    });
    const overlappingSchedule = dateRangeList.find((item) => {
      if (item && dateTimeOverlaps(start, end, item.start, item.end)) {
        return true;
      }
    });
    return !!overlappingSchedule;
  } else {
    return false;
  }
}

function timeOverlaps(timeI: AppRecurringSchedule, tiemJ: AppRecurringSchedule) {
  const startDateTimeI = moment('1970-01-01T' + timeI.start_time, AutoscalerConstants.MomentFormateDateTimeT);
  const endDateTimeI = moment('1970-01-01T' + timeI.end_time, AutoscalerConstants.MomentFormateDateTimeT);
  const startDateTimeJ = moment('1970-01-01T' + tiemJ.start_time, AutoscalerConstants.MomentFormateDateTimeT);
  const endDateTimeJ = moment('1970-01-01T' + tiemJ.end_time, AutoscalerConstants.MomentFormateDateTimeT);
  return dateTimeOverlaps(startDateTimeI, endDateTimeI, startDateTimeJ, endDateTimeJ);
}

function dateOverlaps(dateI: AppRecurringSchedule, dateJ: AppRecurringSchedule) {
  const startDateTimeI = moment(dateI.start_date + 'T00:00', AutoscalerConstants.MomentFormateDateTimeT);
  const endDateTimeI = moment(dateI.end_date + 'T23:59', AutoscalerConstants.MomentFormateDateTimeT);
  const startDateTimeJ = moment(dateJ.start_date + 'T00:00', AutoscalerConstants.MomentFormateDateTimeT);
  const endDateTimeJ = moment(dateJ.end_date + 'T23:59', AutoscalerConstants.MomentFormateDateTimeT);
  return dateTimeOverlaps(startDateTimeI, endDateTimeI, startDateTimeJ, endDateTimeJ);
}

function dateTimeOverlaps(
  startDateTimeI: moment.Moment, endDateTimeI: moment.Moment,
  startDateTimeJ: moment.Moment, endDateTimeJ: moment.Moment) {
  if (startDateTimeJ.isAfter(startDateTimeI)) {
    return endDateTimeI.isAfter(startDateTimeJ);
  } else {
    return endDateTimeJ.isAfter(startDateTimeI);
  }
}

export function getThresholdMin(policyTriggers: AppScalingRule[], metricType: string, scaleType: string, index: number) {
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

export function getThresholdMax(policyTriggers: AppScalingRule[], metricType: string, scaleType: string, index: number) {
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

export function inValidMetricType(metricType: string) {
  const metricTypePattern = new RegExp('^[a-zA-Z0-9_]+$');
  return !metricTypePattern.test(metricType);
}
