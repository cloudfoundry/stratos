import * as moment from 'moment-timezone';

import {
  getScaleType,
  PolicyDefaultSetting,
  ScaleTypes,
  isEqual
} from './autoscaler-util';

export function autoscalerTransformArrayToMap(newPolicy) {
  newPolicy.enabled = true;
  newPolicy.scaling_rules_map = {};
  newPolicy.scaling_rules_form = [];
  if (newPolicy.scaling_rules) {
    newPolicy.scaling_rules.map((trigger) => {
      initIfUndefined(trigger, 'breach_duration_secs', PolicyDefaultSetting.breach_duration_secs_default);
      initIfUndefined(trigger, 'cool_down_secs', PolicyDefaultSetting.cool_down_secs_default);
      pushAndSortTrigger(newPolicy.scaling_rules_map, trigger.metric_type, trigger);
    });
  }
  let maxThreshold = 0;
  Object.keys(newPolicy.scaling_rules_map).map((metricName) => {
    if (newPolicy.scaling_rules_map[metricName].upper && newPolicy.scaling_rules_map[metricName].upper.length > 0) {
      maxThreshold = newPolicy.scaling_rules_map[metricName].upper[0].threshold;
      setUpperColor(newPolicy.scaling_rules_map[metricName].upper);
    }
    if (newPolicy.scaling_rules_map[metricName].lower && newPolicy.scaling_rules_map[metricName].lower.length > 0) {
      maxThreshold = newPolicy.scaling_rules_map[metricName].lower[0].threshold > maxThreshold ?
        newPolicy.scaling_rules_map[metricName].lower[0].threshold : maxThreshold;
      setLowerColor(newPolicy.scaling_rules_map[metricName].lower);
    }
    ScaleTypes.map((triggerType) => {
      if (newPolicy.scaling_rules_map[metricName][triggerType]) {
        newPolicy.scaling_rules_map[metricName][triggerType].map((trigger) => {
          newPolicy.scaling_rules_form.push(trigger);
        });
      }
    });
  });
  initIfUndefined(newPolicy, 'schedules', { timezone: moment.tz.guess() });
  initIfUndefined(newPolicy.schedules, 'recurring_schedule', []);
  initIfUndefined(newPolicy.schedules, 'specific_date', []);
  return newPolicy;
}

function setUpperColor(array) {
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

function setLowerColor(array) {
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

export function autoscalerTransformMapToArray(newPolicy) {
  if (newPolicy.scaling_rules_form) {
    const scalingRules = [];
    newPolicy.scaling_rules_form.map((trigger) => {
      deleteIf(trigger, 'breach_duration_secs', trigger.breach_duration_secs === PolicyDefaultSetting.breach_duration_secs_default);
      deleteIf(trigger, 'cool_down_secs', trigger.cool_down_secs === PolicyDefaultSetting.cool_down_secs_default);
      delete trigger.color;
      scalingRules.push(trigger);
    });
    if (scalingRules.length > 0) {
      newPolicy.scaling_rules = scalingRules;
    }
  }
  delete newPolicy.scaling_rules_form;
  delete newPolicy.scaling_rules_map;
  if (newPolicy.schedules) {
    deleteIf(
      newPolicy.schedules, 'recurring_schedule',
      newPolicy.schedules.recurring_schedule && newPolicy.schedules.recurring_schedule.length === 0);
    deleteIf(
      newPolicy.schedules, 'specific_date',
      newPolicy.schedules.specific_date && newPolicy.schedules.specific_date.length === 0);
    deleteIf(newPolicy, 'schedules', !newPolicy.schedules.recurring_schedule && !newPolicy.schedules.specific_date);
  }
  return newPolicy;
}

function pushAndSortTrigger(map, metricName, newTrigger) {
  const scaleType = getScaleType(newTrigger.operator);
  if (!map[metricName]) {
    map[metricName] = {};
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

function initIfUndefined(fatherEntity, childName, defaultData) {
  if (fatherEntity[childName] === undefined || fatherEntity[childName] === '') {
    fatherEntity[childName] = defaultData;
  }
}

function deleteIf(fatherEntity, childName, condition) {
  if (condition) {
    delete fatherEntity[childName];
  }
}

export function isPolicyMapEqual(a, b) {
  return isEqual(autoscalerTransformMapToArray(a), autoscalerTransformMapToArray(b));
}
