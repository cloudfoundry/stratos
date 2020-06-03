import * as moment from 'moment-timezone';

import {
  AppAutoscalerPolicy,
  AppAutoscalerPolicyLocal,
  AppScalingRule,
  AppScalingTrigger,
} from '../../store/app-autoscaler.types';
import { AutoscalerConstants, getScaleType, isEqual } from './autoscaler-util';

export function autoscalerTransformArrayToMap(policy: AppAutoscalerPolicy) {
  const newPolicy: AppAutoscalerPolicyLocal = {
    ...policy,
    enabled: true,
    scaling_rules_map: {},
    scaling_rules_form: []
  };
  newPolicy.scaling_rules = newPolicy.scaling_rules || [];
  newPolicy.scaling_rules.map((trigger) => {
    pushAndSortTrigger(newPolicy.scaling_rules_map, trigger.metric_type, trigger);
  });
  let maxThreshold = 0;
  Object.keys(newPolicy.scaling_rules_map).map((metricName) => {
    if (newPolicy.scaling_rules_map[metricName].upper && newPolicy.scaling_rules_map[metricName].upper.length > 0) {
      maxThreshold = newPolicy.scaling_rules_map[metricName].upper[0].threshold;
      setUpperColor(newPolicy.scaling_rules_map[metricName].upper);
    }
    if (newPolicy.scaling_rules_map[metricName].lower && newPolicy.scaling_rules_map[metricName].lower.length > 0) {
      maxThreshold = Math.max(newPolicy.scaling_rules_map[metricName].lower[0].threshold, maxThreshold);
      setLowerColor(newPolicy.scaling_rules_map[metricName].lower);
    }
    buildFormUponMap(newPolicy, metricName);
  });
  newPolicy.schedules = newPolicy.schedules || { timezone: moment.tz.guess() };
  newPolicy.schedules.recurring_schedule = newPolicy.schedules.recurring_schedule || [];
  newPolicy.schedules.specific_date = newPolicy.schedules.specific_date || [];
  return newPolicy;
}

function setUpperColor(array: AppScalingRule[]) {
  // from FF0000 to FFFF00
  // from rgba(255,0,0,0.6) to rgba(255,255,0,0.6)
  const max = 255; // parseInt('FF', 16)
  const min = 0; // parseInt('00', 16)
  const scope = max - min;
  if (array && array.length > 0) {
    const interval = Math.round(scope / array.length);
    for (let i = 0; i < array.length; i++) {
      let color10 = 0 + i * interval;
      if (color10 > max) {
        color10 = max;
      }
      // let color16 = color10.toString(16)
      // if (color16.length === 1) color16 = '0' + color16
      array[i].color = 'rgba(255, ' + color10 + ', 0, 0.6)'; // '#ff' + color16 + '00'
    }
  }
}

function setLowerColor(array: AppScalingRule[]) {
  // from 3344ff to 33ccff
  // from rgba(51,68,255,0.6) to rgba(51,204,255,0.6)
  const max = 204; // parseInt('CC', 16)
  const min = 68; // parseInt('44', 16)
  const scope = max - min;
  if (array && array.length > 0) {
    const interval = Math.round(scope / array.length);
    for (let i = 0; i < array.length; i++) {
      let color10 = max - i * interval;
      if (color10 < min) {
        color10 = min;
      }
      // let color16 = color10.toString(16)
      // if (color16.length === 1) color16 = '0' + color16
      array[i].color = 'rgba(51, ' + color10 + ', 255, 0.6)'; // '#33' + color16 + 'ff'
    }
  }
}

export function autoscalerTransformMapToArray(oldPolicy: AppAutoscalerPolicyLocal) {
  const newPolicy: AppAutoscalerPolicy = {
    instance_min_count: oldPolicy.instance_min_count,
    instance_max_count: oldPolicy.instance_max_count
  };
  const scalingRules: AppScalingRule[] = oldPolicy.scaling_rules_form.map((trigger) => {
    const newTrigger: AppScalingRule = {
      adjustment: trigger.adjustment,
      breach_duration_secs: trigger.breach_duration_secs,
      cool_down_secs: trigger.breach_duration_secs,
      metric_type: trigger.metric_type,
      operator: trigger.operator,
      threshold: trigger.threshold
    };
    if (AutoscalerConstants.getMetricUnit(trigger.metric_type) === '' && trigger.unit && trigger.unit !== '') {
      newTrigger.unit = trigger.unit;
    }
    return newTrigger;
  });
  if (scalingRules.length > 0) {
    newPolicy.scaling_rules = scalingRules;
  }
  if (oldPolicy.schedules &&
    (hasNamedSchedule(oldPolicy.schedules.recurring_schedule) || hasNamedSchedule(oldPolicy.schedules.specific_date))) {
    newPolicy.schedules = {
      timezone: oldPolicy.schedules.timezone
    };
    if (hasNamedSchedule(oldPolicy.schedules.recurring_schedule)) {
      newPolicy.schedules.recurring_schedule = oldPolicy.schedules.recurring_schedule;
    }
    if (hasNamedSchedule(oldPolicy.schedules.specific_date)) {
      newPolicy.schedules.specific_date = oldPolicy.schedules.specific_date;
    }
  }
  return newPolicy;
}

function hasNamedSchedule(schedule: any) {
  return schedule !== undefined && schedule !== null && schedule.length > 0;
}

function pushAndSortTrigger(map: { [metricName: string]: AppScalingTrigger }, metricName: string, newTrigger: AppScalingRule) {
  const scaleType = getScaleType(newTrigger.operator);
  newTrigger.breach_duration_secs =
    newTrigger.breach_duration_secs || AutoscalerConstants.PolicyDefaultSetting.breach_duration_secs_default;
  newTrigger.cool_down_secs = newTrigger.cool_down_secs || AutoscalerConstants.PolicyDefaultSetting.cool_down_secs_default;
  if (!map[metricName]) {
    map[metricName] = {
      upper: [],
      lower: []
    };
  }
  if (!map[metricName][scaleType]) {
    map[metricName][scaleType] = [];
  }
  for (let i = 0; i < map[metricName][scaleType].length; i++) {
    if (newTrigger.threshold > map[metricName][scaleType][i].threshold) {
      map[metricName][scaleType].splice(i, 0, newTrigger);
      return;
    }
  }
  map[metricName][scaleType].push(newTrigger);
}

function buildFormUponMap(newPolicy: AppAutoscalerPolicyLocal, metricName: string) {
  AutoscalerConstants.ScaleTypes.forEach((triggerType) => {
    if (newPolicy.scaling_rules_map[metricName][triggerType]) {
      newPolicy.scaling_rules_map[metricName][triggerType].forEach((trigger: AppScalingRule) => {
        newPolicy.scaling_rules_form.push(trigger);
      });
    }
  });
}

export function isPolicyMapEqual(a: AppAutoscalerPolicyLocal, b: AppAutoscalerPolicyLocal) {
  return isEqual(autoscalerTransformMapToArray(a), autoscalerTransformMapToArray(b));
}
