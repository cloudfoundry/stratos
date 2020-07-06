import * as moment from 'moment-timezone';

import {
  AppAutoscalerMetricDataPoint,
  AppAutoscalerMetricLegend,
  AppAutoscalerMetricMapInfo,
  AppScalingRule,
  AppScalingTrigger,
} from '../../store/app-autoscaler.types';


export class AutoscalerConstants {
  public static S2NS = 1000000000;
  public static MetricTypes = ['memoryused', 'memoryutil', 'responsetime', 'throughput', 'cpu'];
  public static MetricPercentageTypes = ['memoryutil'];
  public static ScaleTypes = ['upper', 'lower'];
  public static UpperOperators = ['>', '>='];
  public static LowerOperators = ['<', '<='];
  public static WeekdayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  public static MonthdayOptions = (() => {
    const days = [];
    for (let i = 0; i < 31; i++) {
      days[i] = i + 1;
    }
    return days;
  })();

  public static normalColor = 'rgba(90,167,0,0.6)';
  public static MomentFormateDate = 'YYYY-MM-DD';
  public static MomentFormateDateTimeT = 'YYYY-MM-DDTHH:mm';
  public static MomentFormateTime = 'HH:mm';
  public static MomentFormateTimeS = 'HH:mm:ss';

  public static PolicyDefaultSetting = {
    breach_duration_secs_default: 120,
    breach_duration_secs_min: 60,
    breach_duration_secs_max: 3600,
    cool_down_secs_default: 300,
    cool_down_secs_min: 60,
    cool_down_secs_max: 3600,
  };
  public static PolicyDefaultTrigger = {
    metric_type: 'memoryused',
    breach_duration_secs: AutoscalerConstants.PolicyDefaultSetting.breach_duration_secs_default,
    threshold: 10,
    operator: '<=',
    cool_down_secs: AutoscalerConstants.PolicyDefaultSetting.cool_down_secs_default,
    adjustment: '-1'
  };
  public static PolicyDefaultRecurringSchedule = {
    start_time: '10:00',
    end_time: '18:00',
    days_of_week: [
      1, 2, 3
    ],
    instance_min_count: 1,
    instance_max_count: 10,
    initial_min_instance_count: 5
  };
  public static PolicyDefaultSpecificDate = {
    start_date_time: moment().add(1, 'days').set('hour', 10).set('minute', 0).format(AutoscalerConstants.MomentFormateDateTimeT),
    end_date_time: moment().add(1, 'days').set('hour', 18).set('minute', 0).format(AutoscalerConstants.MomentFormateDateTimeT),
    instance_min_count: 1,
    instance_max_count: 10,
    initial_min_instance_count: 5
  };

  public static metricMap: { [metricName: string]: AppAutoscalerMetricMapInfo } = {
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

  public static getMetricUnit(metricType: string, unit?: string) {
    if (AutoscalerConstants.metricMap[metricType]) {
      return AutoscalerConstants.metricMap[metricType].unit_internal;
    } else {
      return unit || '';
    }
  }

  public static getMetricInterval(metricType: string) {
    if (AutoscalerConstants.metricMap[metricType]) {
      return AutoscalerConstants.metricMap[metricType].interval;
    } else {
      return 40;
    }
  }

  public static createMetricId(appGuid: string, metricType: string): string {
    return appGuid + ':' + metricType;
  }

  public static getMetricFromMetricId(metricId: string): string {
    return metricId.slice(metricId.indexOf(':') + 1, metricId.length);
  }
}

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

export function isEqual(a: any, b: any): boolean {
  if (typeof a !== typeof b) {
    return false;
  } else {
    if (typeof a === 'object') {
      if (Object.keys(a).length !== Object.keys(b).length) {
        return false;
      }
      let equal = true;
      Object.keys(a).map((key) => {
        equal = equal && isEqual(a[key], b[key]);
      });
      return equal;
    } else {
      return JSON.stringify(a) === JSON.stringify(b);
    }
  }
}

export function getScaleType(operator: string): string {
  if (AutoscalerConstants.LowerOperators.indexOf(operator) >= 0) {
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

function buildUpperLegendData(legendData: any, upper: AppScalingRule[], noLower: boolean): AppScalingRule {
  let latestUl: AppScalingRule;
  upper.forEach((item, index) => {
    const name = getLegendName(item, latestUl, index === 0, false);
    legendData.push({
      name,
      value: item.color
    });
    latestUl = item;
  });
  if (noLower) {
    legendData.push({
      name: `${upper[0].metric_type} ${getOppositeOperator(latestUl.operator)} ${latestUl.threshold}`,
      value: AutoscalerConstants.normalColor
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
