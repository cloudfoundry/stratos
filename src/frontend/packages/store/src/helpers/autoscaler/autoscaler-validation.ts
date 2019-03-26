import * as intersect from 'intersect';
import * as moment from 'moment-timezone';
import {
  LowerOperators,
  UpperOperators,
  MomentFormateDateTimeT,
  MomentFormateDate
} from './autoscaler-util';

export function numberWithFractionOrExceedRange(value, min, max, required) {
  if ((!value || isNaN(value)) && !required) {
    return false;
  }
  if ((!value || isNaN(value)) && required) {
    return true;
  }
  return value.toString().indexOf('.') > -1 || value > max || value < min;
}

export function timeIsSameOrAfter(startTime, endTime) {
  startTime = moment('2000-01-01T' + startTime, MomentFormateDateTimeT);
  endTime = moment('2000-01-01T' + endTime, MomentFormateDateTimeT);
  return startTime.isSameOrAfter(endTime);
}

export function dateIsAfter(startDate, endDate) {
  return moment(startDate, MomentFormateDate).isAfter(moment(endDate, MomentFormateDate));
}

export function dateTimeIsSameOrAfter(startDateTime, endDateTime) {
  return moment(startDateTime).isSameOrAfter(moment(endDateTime));
}

export function recurringSchedulesInvalidRepeatOn(inputRecurringSchedules) {
  const weekdayCount = inputRecurringSchedules.hasOwnProperty('days_of_week') ? inputRecurringSchedules.days_of_week.length : 0;
  const monthdayCount = inputRecurringSchedules.hasOwnProperty('days_of_month') ? inputRecurringSchedules.days_of_month.length : 0;
  return (weekdayCount > 0 && monthdayCount > 0) || (weekdayCount === 0 && monthdayCount === 0);
}

export function recurringSchedulesOverlapping(newSchedule, index, inputRecurringSchedules, property) {
  for (let i = 0; inputRecurringSchedules && i < inputRecurringSchedules.length; i++) {
    if (index === i || !inputRecurringSchedules[i].hasOwnProperty(property) ||
      inputRecurringSchedules[i].start_date && newSchedule.start_date && !dateOverlaps(inputRecurringSchedules[i], newSchedule)) {
      continue;
    }
    if (timeOverlaps(inputRecurringSchedules[i], newSchedule)) {
      const intersects = intersect(inputRecurringSchedules[i][property], newSchedule[property]);
      return intersects.length > 0;
    }
  }
  return false;
}

export function specificDateRangeOverlapping(newSchedule, index, inputSpecificDates) {
  const dateRangeList = [];
  const start = moment(newSchedule.start_date_time, MomentFormateDateTimeT);
  const end = moment(newSchedule.end_date_time, MomentFormateDateTimeT);
  for (let i = 0; inputSpecificDates && i < inputSpecificDates.length; i++) {
    if (i !== index) {
      const starti = moment(inputSpecificDates[i].start_date_time, MomentFormateDateTimeT);
      const endi = moment(inputSpecificDates[i].end_date_time, MomentFormateDateTimeT);
      dateRangeList.push({
        start: starti,
        end: endi
      });
    }
  }
  for (const item of dateRangeList) {
    if (dateTimeOverlaps(start, end, item.start, item.end)) {
      return true;
    }
  }
  return false;
}

function timeOverlaps(timeI, tiemJ) {
  const startDateTimeI = moment('1970-01-01T' + timeI.start_time, MomentFormateDateTimeT);
  const endDateTimeI = moment('1970-01-01T' + timeI.end_time, MomentFormateDateTimeT);
  const startDateTimeJ = moment('1970-01-01T' + tiemJ.start_time, MomentFormateDateTimeT);
  const endDateTimeJ = moment('1970-01-01T' + tiemJ.end_time, MomentFormateDateTimeT);
  return dateTimeOverlaps(startDateTimeI, endDateTimeI, startDateTimeJ, endDateTimeJ);
}

function dateOverlaps(dateI, dateJ) {
  const startDateTimeI = moment(dateI.start_date + 'T00:00', MomentFormateDateTimeT);
  const endDateTimeI = moment(dateI.end_date + 'T23:59', MomentFormateDateTimeT);
  const startDateTimeJ = moment(dateJ.start_date + 'T00:00', MomentFormateDateTimeT);
  const endDateTimeJ = moment(dateJ.end_date + 'T23:59', MomentFormateDateTimeT);
  return dateTimeOverlaps(startDateTimeI, endDateTimeI, startDateTimeJ, endDateTimeJ);
}

function dateTimeOverlaps(startDateTimeI, endDateTimeI, startDateTimeJ, endDateTimeJ) {
  if (startDateTimeJ.isAfter(startDateTimeI)) {
    return endDateTimeI.isAfter(startDateTimeJ);
  } else {
    return endDateTimeJ.isAfter(startDateTimeI);
  }
}

export function getThresholdMin(policyTriggers, metricType, scaleType, index) {
  let thresholdMin = 1;
  if (scaleType === 'upper') {
    policyTriggers.map((trigger, triggerIndex) => {
      if (triggerIndex !== index && trigger.metric_type === metricType && LowerOperators.indexOf(trigger.operator) >= 0) {
        thresholdMin = Math.max(trigger.threshold + 1, thresholdMin);
      }
    });
  }
  return thresholdMin;
}

export function getThresholdMax(policyTriggers, metricType, scaleType, index) {
  let thresholdMax = Number.MAX_VALUE;
  if (scaleType === 'lower') {
    policyTriggers.map((trigger, triggerIndex) => {
      if (triggerIndex !== index && trigger.metric_type === metricType && UpperOperators.indexOf(trigger.operator) >= 0) {
        thresholdMax = Math.min(trigger.threshold - 1, thresholdMax);
      }
    });
  }
  return thresholdMax;
}
