import { addDays, format, setHours, setMinutes } from 'date-fns';

import type {
  AppAutoscalerMetricDataPoint,
  AppAutoscalerMetricLegend,
  AppAutoscalerMetricMapInfo,
  AppScalingRule,
  AppScalingTrigger,
} from '../../store/app-autoscaler.types';


// Constants
export const S2NS = 1000000000;
export const MetricTypes = ['memoryused', 'memoryutil', 'responsetime', 'throughput', 'cpu'] as const;
export const MetricPercentageTypes = ['memoryutil'] as const;
export const ScaleTypes = ['upper', 'lower'] as const;
export const UpperOperators = ['>', '>='] as const;
export const LowerOperators = ['<', '<='] as const;
export const WeekdayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const MonthdayOptions = (() => {
  const days: number[] = [];
  for (let i = 0; i < 31; i++) {
    days[i] = i + 1;
  }
  return days;
})();

export const normalColor = 'rgba(90,167,0,0.6)';
export const MomentFormateDate = 'yyyy-MM-dd';
export const MomentFormateDateTimeT = "yyyy-MM-dd'T'HH:mm";
export const MomentFormateTime = 'HH:mm';
export const MomentFormateTimeS = 'HH:mm:ss';

export const PolicyDefaultSetting = {
  breach_duration_secs_default: 120,
  breach_duration_secs_min: 60,
  breach_duration_secs_max: 3600,
  cool_down_secs_default: 300,
  cool_down_secs_min: 60,
  cool_down_secs_max: 3600,
} as const;

export const PolicyDefaultTrigger = {
  metric_type: 'memoryused',
  breach_duration_secs: PolicyDefaultSetting.breach_duration_secs_default,
  threshold: 10,
  operator: '<=',
  cool_down_secs: PolicyDefaultSetting.cool_down_secs_default,
  adjustment: '-1'
} as const;

export const PolicyDefaultRecurringSchedule = {
  start_time: '10:00',
  end_time: '18:00',
  days_of_week: [
    1, 2, 3
  ] as number[],
  instance_min_count: 1,
  instance_max_count: 10,
  initial_min_instance_count: 5
};

export const PolicyDefaultSpecificDate = {
  start_date_time: format(setMinutes(setHours(addDays(new Date(), 1), 10), 0), MomentFormateDateTimeT),
  end_date_time: format(setMinutes(setHours(addDays(new Date(), 1), 18), 0), MomentFormateDateTimeT),
  instance_min_count: 1,
  instance_max_count: 10,
  initial_min_instance_count: 5
} as const;

export const metricMap: { [metricName: string]: AppAutoscalerMetricMapInfo } = {
  memoryused: {
    unit_internal: 'MB',
    interval: 40,
  },
  memoryutil: {
    unit_internal: ' % ',
    interval: 40,
  },
  responsetime: {
    unit_internal: 'ms',
    interval: 40,
  },
  throughput: {
    unit_internal: 'rps',
    interval: 40,
  },
  cpu: {
    unit_internal: ' % ',
    interval: 40,
  }
};

export function getMetricUnit(metricType: string, unit?: string): string {
  if (metricMap[metricType]) {
    return metricMap[metricType].unit_internal;
  }
  return unit || '';
}

export function getMetricInterval(metricType: string): number {
  if (metricMap[metricType]) {
    return metricMap[metricType].interval;
  }
  return 40;
}

export function createMetricId(appGuid: string, metricType: string): string {
  return `${appGuid}:${metricType}`;
}

export function getMetricFromMetricId(metricId: string): string {
  return metricId.slice(metricId.indexOf(':') + 1, metricId.length);
}

// Backward compatibility object (can be removed if all usages are updated)
export const AutoscalerConstants = {
  S2NS,
  MetricTypes,
  MetricPercentageTypes,
  ScaleTypes,
  UpperOperators,
  LowerOperators,
  WeekdayOptions,
  MonthdayOptions,
  normalColor,
  MomentFormateDate,
  MomentFormateDateTimeT,
  MomentFormateTime,
  MomentFormateTimeS,
  PolicyDefaultSetting,
  PolicyDefaultTrigger,
  PolicyDefaultRecurringSchedule,
  PolicyDefaultSpecificDate,
  metricMap,
  getMetricUnit,
  getMetricInterval,
  createMetricId,
  getMetricFromMetricId,
} as const;

export const PolicyAlert = {
  alertInvalidPolicyMinimumRange: 'The Minimum Instance Count must be an integer less than the Maximum Instance Count.',
  alertInvalidPolicyMaximumRange: 'The Maximum Instance Count must be an integer greater than the Minimum Instance Count.',
  alertInvalidPolicyInitialMaximumRange:
    'The Initial Minimum Instance Count must be an integer between Minimum Instance Count and Maximum Instance Count.',
  alertInvalidPolicyTriggerMetricName: 'Invalid metric type name, only combination of letters, numbers and underlines "_" are allowed.',
  alertInvalidPolicyTriggerUpperThresholdRange: 'The Upper Threshold value must be an integer greater than the Lower Threshold value.',
  alertInvalidPolicyTriggerLowerThresholdRange: 'The Lower Threshold value must be an integer between 1 and (Upper Threshold-1).',
  alertInvalidPolicyTriggerThreshold100: 'The Lower/Upper Threshold value of memoryutil must be an integer below or equal to 100.',
  alertInvalidPolicyTriggerStepPercentageRange: 'The Instance Step Up/Down percentage must be an integer greater than 1.',
  alertInvalidPolicyTriggerStepRange: 'The Instance Step Up/Down value must be an integer between 1 and (Maximum Instance-1).',
  alertInvalidPolicyTriggerBreachDurationRange:
    `The breach duration value must be an integer between ${AutoscalerConstants.PolicyDefaultSetting.breach_duration_secs_min} and
    ${AutoscalerConstants.PolicyDefaultSetting.breach_duration_secs_max} seconds.`,
  alertInvalidPolicyTriggerCooldownRange:
    `The cooldown period value must be an integer between ${AutoscalerConstants.PolicyDefaultSetting.cool_down_secs_min} and
    ${AutoscalerConstants.PolicyDefaultSetting.breach_duration_secs_max} seconds.`,
  alertInvalidPolicyScheduleDateBeforeNow: 'Start/End date should be after or equal to the current date.',
  alertInvalidPolicyScheduleEndDateBeforeStartDate: 'Start date must be earlier than the end date.',
  alertInvalidPolicyScheduleEndTimeBeforeStartTime: 'Start time must be earlier than the end time.',
  alertInvalidPolicyScheduleRepeatOn: 'Please select at least one "Repeat On" day.',
  alertInvalidPolicyScheduleEndDateTimeBeforeStartDateTime: 'Start date and time must be earlier than the end date and time.',
  alertInvalidPolicyScheduleStartDateTimeBeforeNow: 'Start date and time must be after or equal to the current date time.',
  alertInvalidPolicyScheduleEndDateTimeBeforeNow: 'End date and time must be after or equal to the current date and time.',
  alertInvalidPolicyScheduleRecurringConflict: 'Recurring schedule configuration conflict occurs.',
  alertInvalidPolicyScheduleSpecificConflict: 'Specific date configuration conflict occurs.',
  alertInvalidPolicyTriggerScheduleEmpty: 'At least one Scaling Rule or Schedule should be defined.',
};

export function isEqual(a: unknown, b: unknown): boolean {
  if (typeof a !== typeof b) {
    return false;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    if (a === null || b === null) {
      return a === b;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }
    let equal = true;
    for (const key of keysA) {
      equal = equal && isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]);
    }
    return equal;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

export function getScaleType(operator: string): string {
  if (AutoscalerConstants.LowerOperators.indexOf(operator as typeof AutoscalerConstants.LowerOperators[number]) >= 0) {
    return 'lower';
  } else {
    return 'upper';
  }
}

export function getAdjustmentType(adjustment: string): string {
  return adjustment.indexOf('%') >= 0 ? 'percentage' : 'value';
}

export function buildLegendData(trigger: AppScalingTrigger): AppAutoscalerMetricLegend[] {
  const legendData: AppAutoscalerMetricLegend[] = [];
  let latestUl: AppScalingRule = null;
  if (trigger.upper && trigger.upper.length > 0) {
    const noLowerRule = !trigger.lower || trigger.lower.length === 0;
    latestUl = buildUpperLegendData(legendData, trigger.upper, noLowerRule);
  }
  if (trigger.lower && trigger.lower.length > 0) {
    latestUl = buildLowerLegendData(legendData, trigger.lower, latestUl);
  }
  return legendData;
}

function getLegendName(currentRule: AppScalingRule, latestRule: AppScalingRule, singleRange: boolean, isLowerRule: boolean) {
  if (singleRange) {
    const operator = isLowerRule ? getOppositeOperator(currentRule.operator) : currentRule.operator;
    return `${currentRule.metric_type} ${operator} ${currentRule.threshold}`;
  } else {
    return `${currentRule.threshold} ${getLeftOperator(currentRule.operator)} ${currentRule.
      metric_type} ${getRightOperator(latestRule.operator)} ${latestRule.threshold}`;
  }
}

function buildUpperLegendData(legendData: AppAutoscalerMetricLegend[], upper: AppScalingRule[], noLower: boolean): AppScalingRule {
  let latestUl: AppScalingRule;
  upper.forEach((item, index) => {
    const name = getLegendName(item, latestUl, index === 0, false);
    legendData.push({
      name,
      value: item.color || ''
    });
    latestUl = item;
  });
  if (noLower) {
    legendData.push({
      name: `${upper[0].metric_type} ${getOppositeOperator(latestUl.operator)} ${latestUl.threshold}`,
      value: normalColor
    });
  }
  return latestUl;
}

function buildLowerLegendData(
  legendData: AppAutoscalerMetricDataPoint[],
  lower: AppScalingRule[],
  latestUl: AppScalingRule
): AppScalingRule {
  lower.forEach((item, index) => {
    const isSingleRange = !latestUl || !latestUl.threshold;
    const name = getLegendName(item, latestUl, isSingleRange, true);
    legendData.push({
      name,
      value: index === 0 ? AutoscalerConstants.normalColor : latestUl.color
    });
    latestUl = item;
  });
  legendData.push({
    name: `${lower[0].metric_type} ${latestUl.operator} ${latestUl.threshold}`,
    value: latestUl.color
  });
  return latestUl;
}

function getOppositeOperator(operator: string): string {
  switch (operator) {
    case '>':
      return '<=';
    case '>=':
      return '<';
    case '<':
      return '>=';
    default:
      return '>';
  }
}

function getRightOperator(operator: string): string {
  switch (operator) {
    case '>':
      return '<=';
    case '>=':
      return '<';
    default:
      return operator;
  }
}

function getLeftOperator(operator: string): string {
  switch (operator) {
    case '>':
      return '<';
    case '>=':
      return '<=';
    case '<':
      return '<=';
    default:
      return '<';
  }
}

export function shiftArray(array: number[], step: number): number[] {
  return array.map(value => value + step);
}
