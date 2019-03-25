import * as moment from 'moment';
import {
  getScaleType,
  metricMap,
  S2NS,
  MomentFormateTimeS,
  normalColor
} from './autoscaler-util';

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
    unit: metricMap[metricName].unit_internal,
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
        target,
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
      target[targetIndex].value = Number(metric.value);
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

function buildTriggerName(item) {
  const type = getScaleType(item.operator);
  return `${type} threshold: ${item.operator} ${item.threshold}`;
}

function buildSingleMarkLine(lineChartSeries, metricData, ul) {
  ul.map((item) => {
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

function executeCompare(val1, operator, val2) {
  switch (operator) {
    case '>':
      return val1 > val2;
    case '>=':
      return val1 >= val2;
    case '<':
      return val1 < val2;
    default:
      return val1 <= val2;
  }
}

function getColor(trigger, value) {
  let color = normalColor;
  if (Number.isNaN(value)) {
    return color;
  }
  for (let i = 0; trigger.upper && trigger.upper.length > 0 && i < trigger.upper.length; i++) {
    if (executeCompare(value, trigger.upper[i].operator, trigger.upper[i].threshold)) {
      color = trigger.upper[i].color;
      break;
    }
  }
  for (let i = 0; trigger.lower && trigger.lower.length > 0 && i < trigger.lower.length; i++) {
    const index = trigger.lower.length - 1 - i;
    if (executeCompare(value, trigger.lower[index].operator, trigger.lower[index].threshold)) {
      color = trigger.lower[index].color;
      break;
    }
  }
  return color;
}

function getMetricBasicInfo(metricName, source, trigger) {
  const map = {};
  let interval = metricMap[metricName].interval;
  let maxCount = 1;
  let preTimestamp = 0;
  let maxValue = -1;
  let unit = metricMap[metricName].unit_internal;
  map[interval] = 1;
  for (const item of source) {
    maxValue = Math.max(Number(item.value), maxValue);
    const thisTimestamp = Math.round(parseInt(item.timestamp, 10) / S2NS);
    const currentInterval = thisTimestamp - preTimestamp;
    map[currentInterval] = map[currentInterval] ? map[currentInterval] + 1 : 1;
    if (map[currentInterval] > maxCount) {
      interval = currentInterval;
      maxCount = map[currentInterval];
    }
    preTimestamp = thisTimestamp;
    unit = item.unit === '' ? unit : item.unit;
  }
  return {
    interval,
    unit,
    chartMaxValue: getChartMax(trigger, maxValue)
  };
}

function getChartMax(trigger, maxValue) {
  let thresholdCount = 0;
  let maxThreshold = 0;
  let thresholdmax = 0;
  if (trigger.upper && trigger.upper.length > 0) {
    thresholdCount += trigger.upper.length;
    maxThreshold = trigger.upper[0].threshold;
  }
  if (trigger.lower && trigger.lower.length > 0) {
    thresholdCount += trigger.lower.length;
    maxThreshold = Math.max(trigger.lower[0].threshold, maxThreshold);
  }
  if (maxThreshold > 0) {
    thresholdmax = Math.ceil(maxThreshold * (thresholdCount + 1) / (thresholdCount));
  }
  thresholdmax = Math.max(maxValue, thresholdmax, 10);
  for (let i = 10; i < Number.MAX_VALUE && i < thresholdmax; i = i * 10) {
    if (thresholdmax / i >= 1 && thresholdmax / i < 10 && thresholdmax > 100) {
      thresholdmax = (Math.ceil(thresholdmax / i * 10)) * i / 10;
      break;
    } else if (thresholdmax / i >= 1 && thresholdmax / i < 10 && thresholdmax <= 100) {
      thresholdmax = (Math.ceil(thresholdmax / i)) * i;
      break;
    }
  }
  return thresholdmax;
}
