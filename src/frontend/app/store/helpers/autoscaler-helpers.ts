import moment from 'moment-timezone';

export const PolicyDefaultSetting = {
  breach_duration_secs_default: 120,
  cool_down_secs_default: 120,
};
export const MetricTypes = ['memoryused', 'memoryutil', 'responsetime', 'throughput'];
export const ScaleTypes = ['upper', 'lower'];
export const UpperOperators = ['>', '>='];
export const LowerOperators = ['<', '<='];

export const normalColor = 'rgba(90,167,0,0.6)';
export const MomentFormateTimeS = 'HH:mm:ss';

export const metricMap = {
  memoryused: {
    unit: 'metric_unit_mb',
    unit_internal: 'MB',
    type: 'value',
    type_string: 'metric_type_memoryused',
    interval: 15,
  },
  memoryutil: {
    unit: 'metric_unit_percentage',
    unit_internal: 'percent',
    type: 'percentage',
    type_string: 'metric_type_memoryutil',
    interval: 15,
  },
  responsetime: {
    unit: 'metric_unit_ms',
    unit_internal: 'ms',
    type: 'value',
    type_string: 'metric_type_responsetime',
    interval: 30,
  },
  throughput: {
    unit: 'metric_unit_rps',
    unit_internal: 'RPS',
    type: 'value',
    type_string: 'metric_type_throughput',
    interval: 30,
  }
};

export const S2NS = 1000000000;

export function autoscalerTransformArrayToMap(newPolicy, timezone) {
  if (timezone === undefined || timezone === '') {
    timezone = moment.tz.guess();
  }
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
  initIfUndefined(newPolicy, 'schedules', { timezone });
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
      // if (color16.length == 1) color16 = '0' + color16
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
      // if (color16.length == 1) color16 = '0' + color16
      array[i].color = 'rgba(51, ' + color10 + ', 255, 0.6)'; // '#33' + color16 + 'ff'
    }
  }
}

export function autoscalerTransformMapToArray(newPolicy) {
  if (newPolicy.scaling_rules_form) {
    const scaling_rules = [];
    newPolicy.scaling_rules_form.map((trigger) => {
      deleteIf(trigger, 'breach_duration_secs', trigger.breach_duration_secs === PolicyDefaultSetting.breach_duration_secs_default);
      deleteIf(trigger, 'cool_down_secs', trigger.cool_down_secs === PolicyDefaultSetting.cool_down_secs_default);
      scaling_rules.push(trigger);
    });
    if (scaling_rules.length > 0) {
      newPolicy.scaling_rules = scaling_rules;
    }
  }
  delete newPolicy['scaling_rules_form'];
  delete newPolicy['scaling_rules_map'];
  if (newPolicy.schedules) {
    deleteIf(
      newPolicy.schedules,
      'recurring_schedule',
      newPolicy.schedules.recurring_schedule && newPolicy.schedules.recurring_schedule.length === 0);
    deleteIf(
      newPolicy.schedules,
      'specific_date',
      newPolicy.schedules.specific_date && newPolicy.schedules.specific_date.length === 0);
    deleteIf(newPolicy, 'schedules', !newPolicy.schedules.recurring_schedule && !newPolicy.schedules.specific_date);
  }
  return newPolicy;
}

export function isEqual(a, b) {
  if (typeof (a) !== typeof (b)) {
    return false;
  } else {
    if (typeof (a) === 'object') {
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

export function isPolicyMapEqual(a, b) {
  return isEqual(autoscalerTransformMapToArray(a), autoscalerTransformMapToArray(b));
}

function pushAndSortTrigger(map, metricName, newTrigger) {
  const scaleType = LowerOperators.indexOf(newTrigger.operator) < 0 ? ScaleTypes[0] : ScaleTypes[1];
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

export function buildMetricData(metricName, data, startTime, endTime, skipFormat, trigger) {
  const result = {
    latest: {
      target: [{
        name: metricName,
        value: 0
      }, {
        name: '',
        value: 0
      }],
      colorTarget: [
        {
          name: metricName,
          value: 'rgba(0,0,0,0.2)'
        }, {
          name: '',
          value: 'rgba(0,0,0,0.2)'
        }
      ]
    },
    formated: {
      target: [],
      colorTarget: []
    },
    unit: '',
    maxValue: 0,
    chartMaxValue: 0,
  };
  if (data.resources.length > 0) {
    const basicInfo = getMetricBasicInfo(metricName, data.resources, trigger);
    result.unit = basicInfo.unit;
    result.maxValue = basicInfo.maxValue;
    result.chartMaxValue = basicInfo.chartMaxValue;
    if (!skipFormat) {
      const transformed = transformMetricData(data.resources, basicInfo.interval, startTime, endTime, trigger);
      result.formated = {
        target: transformed['target'],
        colorTarget: transformed['colorTarget']
      };
    }
    result.latest = {
      target: [{
        name: metricName,
        value: data.resources[data.resources.length - 1].value
      }, {
        name: '',
        value: basicInfo.chartMaxValue - data.resources[data.resources.length - 1].value
      }],
      colorTarget: [
        {
          name: metricName,
          value: getColor(trigger, data.resources[data.resources.length - 1].value)
        }, {
          name: '',
          value: 'rgba(0,0,0,0.2)'
        }
      ]
    };
  }
  return result;
}

function transformMetricData(source, interval, startTime, endTime, trigger) {
  startTime = Math.round(startTime / S2NS);
  endTime = Math.round(endTime / S2NS);
  if (source.length === 0) {
    return [];
  }
  const scope = Math.round(interval / 2);
  const target = [];
  let targetTimestamp = Math.round(source[0].timestamp / S2NS);
  let targetIndex = 0;

  const insertEmptyNumber = Math.floor((targetTimestamp - startTime) / interval);
  const startTimestamp = targetTimestamp - insertEmptyNumber * interval;
  for (; targetIndex < insertEmptyNumber; targetIndex++) {
    target[targetIndex] = {
      time: startTimestamp + targetIndex * interval,
      name: moment((startTimestamp + targetIndex * interval) * 1000).format(MomentFormateTimeS),
      value: 0
    };
  }

  let sourceIndex = 0;
  while (sourceIndex < source.length) {
    if (!target[targetIndex]) {
      target[targetIndex] = {
        time: targetTimestamp,
        name: moment(targetTimestamp * 1000).format(MomentFormateTimeS),
        value: 0
      };
    }
    const metric = source[sourceIndex];
    const sourceTimestamp = Math.round(metric.timestamp / S2NS);
    if (sourceTimestamp < targetTimestamp - scope) {
      sourceIndex++;
    } else if (sourceTimestamp > targetTimestamp + scope) {
      targetIndex++;
      targetTimestamp += interval;
    } else {
      target[targetIndex]['value'] = parseInt(metric.value, 10);
      sourceIndex++;
    }
  }
  let currentLatestTime = target[targetIndex].time + interval;
  while (currentLatestTime < endTime) {
    target.push({
      time: currentLatestTime,
      name: moment(currentLatestTime * 1000).format(MomentFormateTimeS),
      value: 0
    });
    currentLatestTime = currentLatestTime + interval;
  }
  const colorTarget = [];
  target.map((cell) => {
    colorTarget.push({
      name: cell.name,
      value: getColor(trigger, cell.value),
    });
  });
  return {
    target,
    colorTarget
  };
}

function getColor(trigger, value) {
  if (!isNaN(value)) {
    for (let i = 0; trigger.upper && trigger.upper.length > 0 && i < trigger.upper.length; i++) {
      if (trigger.upper[i].operator === '>=' && value >= trigger.upper[i].threshold) {
        return trigger.upper[i].color;
      }
      if (trigger.upper[i].operator === '>' && value > trigger.upper[i].threshold) {
        return trigger.upper[i].color;
      }
    }
    for (let i = 0; trigger.lower && trigger.lower.length > 0 && i < trigger.lower.length; i++) {
      const index = trigger.lower.length - 1 - i;
      if (trigger.lower[index].operator === '<=' && value <= trigger.lower[index].threshold) {
        return trigger.lower[index].color;
      }
      if (trigger.lower[index].operator === '<' && value < trigger.lower[index].threshold) {
        return trigger.lower[index].color;
      }
    }
  }
  return normalColor;
}

function getMetricBasicInfo(metricName, source, trigger) {
  const map = {};
  let interval = metricMap[metricName]['interval'];
  let maxCount = 0;
  const preTimestampMap = {};
  let maxIndex = -1;
  let maxValue = -1;
  for (let i = 0; i < source.length; i++) {
    maxValue = parseInt(source[i].value, 10) > maxValue ? parseInt(source[i].value, 10) : maxValue;
    const thisTimestamp = Math.round(parseInt(source[i].timestamp, 10) / S2NS);
    const thisIndex = source[i].instance_index ? source[i].instance_index : 0;
    if (preTimestampMap[thisIndex] === undefined) {
      if (thisIndex > maxIndex) {
        maxIndex = thisIndex;
      }
      preTimestampMap[thisIndex] = thisTimestamp;
    } else {
      const currentInterval = thisTimestamp - preTimestampMap[thisIndex];
      if (map[currentInterval] === undefined) {
        map[currentInterval] = 1;
      } else {
        map[currentInterval]++;
      }
      if (map[currentInterval] > maxCount) {
        interval = currentInterval;
        maxCount = map[currentInterval];
      }
      preTimestampMap[thisIndex] = thisTimestamp;
    }
  }
  return {
    interval: interval,
    maxIndex: maxIndex,
    unit: source[0].unit,
    maxValue: maxValue,
    chartMaxValue: getChartMax(trigger, maxValue)
  };
}

function getChartMax(trigger, maxValue) {
  let upperThresholdCount = 0;
  let lowerThresholdCount = 0;
  let maxThreshold = 0;
  if (trigger.upper && trigger.upper.length > 0) {
    upperThresholdCount = trigger.upper.length;
    maxThreshold = trigger.upper[0].threshold;
  }
  if (trigger.lower && trigger.lower.length > 0) {
    lowerThresholdCount = trigger.lower.length;
    maxThreshold = trigger.lower[0].threshold > maxThreshold ? trigger.lower[0].threshold : maxThreshold;
  }
  let thresholdmax = 0;
  if (maxThreshold > 0) {
    const thresholdCount = upperThresholdCount + lowerThresholdCount;
    thresholdmax = Math.ceil(maxThreshold * (thresholdCount + 1) / (thresholdCount));
  }
  thresholdmax = maxValue > thresholdmax ? maxValue : thresholdmax;
  thresholdmax = thresholdmax > 10 ? thresholdmax : 10;
  for (let i = 10; i < Number.MAX_VALUE && i < thresholdmax; i = i * 10) {
    if (thresholdmax / i >= 1 && thresholdmax / i < 10) {
      if (thresholdmax > 100) {
        thresholdmax = (Math.ceil(thresholdmax / i * 10)) * i / 10;
      } else {
        thresholdmax = (Math.ceil(thresholdmax / i)) * i;
      }
      break;
    }
  }
  return thresholdmax;
}
