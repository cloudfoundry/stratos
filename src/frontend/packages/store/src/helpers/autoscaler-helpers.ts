import * as moment from 'moment';
// import moment from 'moment-timezone';

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
    unit_internal: 'MB',
    interval: 40,
  },
  memoryutil: {
    unit_internal: '%',
    interval: 40,
  },
  responsetime: {
    unit_internal: 'ms',
    interval: 40,
  },
  throughput: {
    unit_internal: 'rps',
    interval: 40,
  }
};

export const S2NS = 1000000000;

export function autoscalerTransformArrayToMap(newPolicy, timezone?) {
  // if (timezone) {
  //   timezone = moment.tz.guess();
  // }
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

function initMeticData(metricName) {
  return {
    latest: {
      target: [{
        name: metricName,
        value: 0
      }],
      colorTarget: [
        {
          name: metricName,
          value: 'rgba(0,0,0,0.2)'
        }
      ]
    },
    formated: {
      target: [],
      colorTarget: []
    },
    markline: [],
    unit: metricMap[metricName]['unit_internal'],
    chartMaxValue: 0,
  };
}

export function buildMetricData(metricName, data, startTime, endTime, skipFormat, trigger) {
  const result = initMeticData(metricName);
  if (data.resources.length > 0) {
    const basicInfo = getMetricBasicInfo(metricName, data.resources, trigger);
    result.unit = basicInfo.unit;
    result.chartMaxValue = basicInfo.chartMaxValue;
    if (!skipFormat) {
      startTime = Math.round(startTime / S2NS);
      endTime = Math.round(endTime / S2NS);
      const target = transformMetricData(data.resources, basicInfo.interval, startTime, endTime);
      const colorTarget = buildMetricColorData(target, trigger);
      result.formated = {
        target: target,
        colorTarget
      };
      result.markline = buildMarkLineData(target, trigger);
    }
    result.latest.target = [{
      name: metricName,
      value: Number(data.resources[data.resources.length - 1].value)
    }];
    result.latest.colorTarget = buildMetricColorData(result.latest.target, trigger);
  }
  return result;
}

export function insertEmptyMetrics(data, startTime, endTime, interval) {
  const insertEmptyNumber = Math.floor((endTime - startTime) / interval) + 1;
  for (let i = 0; i < insertEmptyNumber; i++) {
    const emptyMetric = buildSingleMetricData(startTime + i * interval, 0);
    if (interval < 0) {
      data.unshift(emptyMetric);
    } else {
      data.push(emptyMetric);
    }
  }
  return data;
}

function buildSingleMetricData(timestamp, value) {
  return {
    time: timestamp,
    name: moment(timestamp * 1000).format(MomentFormateTimeS),
    value
  };
}

function transformMetricData(source, interval, startTime, endTime) {
  if (source.length === 0) {
    return [];
  }
  const scope = Math.round(interval / 2);
  const target = [];
  let targetTimestamp = Math.round(source[0].timestamp / S2NS);
  let targetIndex = insertEmptyMetrics(target, targetTimestamp - interval, startTime, -interval).length;
  let sourceIndex = 0;
  while (sourceIndex < source.length) {
    if (!target[targetIndex]) {
      target[targetIndex] = buildSingleMetricData(targetTimestamp, 0);
    }
    const metric = source[sourceIndex];
    const sourceTimestamp = Math.round(metric.timestamp / S2NS);
    if (sourceTimestamp < targetTimestamp - scope) {
      sourceIndex++;
    } else if (sourceTimestamp > targetTimestamp + scope) {
      targetIndex++;
      targetTimestamp += interval;
    } else {
      target[targetIndex]['value'] = Number(metric.value);
      sourceIndex++;
    }
  }
  return insertEmptyMetrics(target, target[targetIndex].time + interval, endTime, interval);
}

function buildMetricColorData(metricData, trigger) {
  const colorTarget = [];
  metricData.map((item) => {
    colorTarget.push({
      name: item.name,
      value: getColor(trigger, item.value),
    });
  });
  if (trigger.upper && trigger.upper.length > 0) {
    buildSingleColor(colorTarget, trigger.upper);
  }
  if (trigger.lower && trigger.lower.length > 0) {
    buildSingleColor(colorTarget, trigger.lower);
  }
  return colorTarget;
}

function buildSingleColor(lineChartSeries, ul) {
  ul.map((item) => {
    const lineData = {
      name: buildTriggerName(item),
      value: item.color
    };
    lineChartSeries.push(lineData);
  });
}

function getOppositeOperator(operator) {
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

function getRightOperator(operator) {
  switch (operator) {
    case '>':
      return '<=';
    case '>=':
      return '<';
    default:
      return operator;
  }
}

function getLeftOperator(operator) {
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

function buildMarkLineData(metricData, trigger) {
  const lineChartSeries = [];
  if (trigger.upper && trigger.upper.length > 0) {
    buildSingleMarkLine(lineChartSeries, metricData, trigger.upper);
  }
  if (trigger.lower && trigger.lower.length > 0) {
    buildSingleMarkLine(lineChartSeries, metricData, trigger.lower);
  }
  return lineChartSeries;
}

export function buildLegendData(trigger) {
  const legendData = [];
  let latestUl = {};
  if (trigger.upper && trigger.upper.length > 0) {
    latestUl = buildUpperLegendData(legendData, trigger.upper, !trigger.lower || trigger.lower.length === 0);
  }
  if (trigger.lower && trigger.lower.length > 0) {
    latestUl = buildLowerLegendData(legendData, trigger.lower, latestUl);
  }
  return legendData;
}

function buildUpperLegendData(legendData, upper, nolower) {
  let latestUl = {};
  upper.map((item, index) => {
    let name = '';
    if (index === 0) {
      name = `${item.metric_type} ${item.operator} ${item.threshold}`;
    } else {
      name = `${item.threshold} ${getLeftOperator(item.operator)} ${item.
        metric_type} ${getRightOperator(latestUl['operator'])} ${latestUl['threshold']}`;
    }
    legendData.push({
      name,
      value: item.color
    });
    latestUl = item;
  });
  if (nolower) {
    legendData.push({
      name: `${upper[0].metric_type} ${getOppositeOperator(latestUl['operator'])} ${latestUl['threshold']}`,
      value: normalColor
    });
  }
  return latestUl;
}

function buildLowerLegendData(legendData, lower, latestUl) {
  lower.map((item, index) => {
    let name = '';
    if (!latestUl['threshold']) {
      name = `${item.metric_type} ${getOppositeOperator(item.operator)} ${item.threshold}`;
    } else {
      name = `${item.threshold} ${getLeftOperator(item.operator)} ${item.
        metric_type} ${getRightOperator(latestUl['operator'])} ${latestUl['threshold']}`;
    }
    legendData.push({
      name,
      value: index === 0 ? normalColor : latestUl.color
    });
    latestUl = item;
  });
  legendData.push({
    name: `${lower[0].metric_type} ${latestUl['operator']} ${latestUl['threshold']}`,
    value: latestUl['color']
  });
  return {};
}

function buildTriggerName(item) {
  const type = LowerOperators.indexOf(item.operator) >= 0 ? 'lower' : 'upper';
  return `${type} threshold: ${item.operator} ${item.threshold}`;
}

function buildSingleMarkLine(lineChartSeries, metricData, ul) {
  ul.map((item) => {
    const type = LowerOperators.indexOf(item.operator) ? 'lower' : 'upper';
    const lineData = {
      name: buildTriggerName(item),
      series: []
    };
    metricData.map((data) => {
      lineData.series.push({
        name: data.name,
        value: item.threshold,
      });
    });
    lineChartSeries.push(lineData);
  });
}

function getColor(trigger, value) {
  let color = normalColor;
  if (!Number.isNaN(value)) {
    for (let i = 0; trigger.upper && trigger.upper.length > 0 && i < trigger.upper.length; i++) {
      if (trigger.upper[i].operator === '>=' && value >= trigger.upper[i].threshold) {
        color = trigger.upper[i].color;
        break;
      }
      if (trigger.upper[i].operator === '>' && value > trigger.upper[i].threshold) {
        color = trigger.upper[i].color;
        break;
      }
    }
    for (let i = 0; trigger.lower && trigger.lower.length > 0 && i < trigger.lower.length; i++) {
      const index = trigger.lower.length - 1 - i;
      if (trigger.lower[index].operator === '<=' && value <= trigger.lower[index].threshold) {
        color = trigger.lower[index].color;
        break;
      }
      if (trigger.lower[index].operator === '<' && value < trigger.lower[index].threshold) {
        color = trigger.lower[index].color;
        break;
      }
    }
  }
  return color;
}

function getMetricBasicInfo(metricName, source, trigger) {
  const map = {};
  let interval = metricMap[metricName]['interval'];
  let maxCount = 1, preTimestamp = 0;
  let maxValue = -1;
  let unit = metricMap[metricName]['unit_internal'];
  map[interval] = 1;
  for (let i = 0; i < source.length; i++) {
    maxValue = Number(source[i].value) > maxValue ? Number(source[i].value) : maxValue;
    const thisTimestamp = Math.round(parseInt(source[i].timestamp, 10) / S2NS);
    const currentInterval = thisTimestamp - preTimestamp;
    if (map[currentInterval] === undefined) {
      map[currentInterval] = 1;
    } else {
      map[currentInterval]++;
    }
    if (map[currentInterval] > maxCount) {
      interval = currentInterval;
      maxCount = map[currentInterval];
    }
    preTimestamp = thisTimestamp;
    unit = source[i].unit === '' ? unit : source[i].unit;
  }
  return {
    interval: interval,
    unit: unit,
    chartMaxValue: getChartMax(trigger, maxValue)
  };
}

function getChartMax(trigger, maxValue) {
  let thresholdCount = 0, maxThreshold = 0, thresholdmax = 0;
  if (trigger.upper && trigger.upper.length > 0) {
    thresholdCount += trigger.upper.length;
    maxThreshold = trigger.upper[0].threshold;
  }
  if (trigger.lower && trigger.lower.length > 0) {
    thresholdCount += trigger.lower.length;
    maxThreshold = trigger.lower[0].threshold > maxThreshold ? trigger.lower[0].threshold : maxThreshold;
  }
  if (maxThreshold > 0) {
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
