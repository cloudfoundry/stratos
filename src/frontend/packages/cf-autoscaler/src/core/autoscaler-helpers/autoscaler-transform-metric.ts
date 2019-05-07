import * as moment from 'moment-timezone';

import { PaginationResponse } from '../../../../store/src/types/api.types';
import {
  AppAutoscalerMetricBasicInfo,
  AppAutoscalerMetricData,
  AppAutoscalerMetricDataLine,
  AppAutoscalerMetricDataLocal,
  AppAutoscalerMetricDataPoint,
  AppScalingRule,
  AppScalingTrigger,
} from '../../store/app-autoscaler.types';
import { AutoscalerConstants, getScaleType } from './autoscaler-util';

function initMetricData(metricName: string): AppAutoscalerMetricDataLocal {
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
    unit: AutoscalerConstants.metricMap[metricName].unit_internal,
    chartMaxValue: 0,
  };
}

export function buildMetricData(
  metricName: string,
  data: PaginationResponse<AppAutoscalerMetricData>,
  startTime: number,
  endTime: number,
  skipFormat: boolean,
  trigger: AppScalingTrigger,
  timezone?: string
): AppAutoscalerMetricDataLocal {
  const result = initMetricData(metricName);
  if (data.resources.length > 0) {
    const basicInfo = getMetricBasicInfo(metricName, data.resources, trigger);
    result.unit = basicInfo.unit;
    result.chartMaxValue = basicInfo.chartMaxValue;
    if (!skipFormat) {
      startTime = Math.round(startTime / AutoscalerConstants.S2NS);
      endTime = Math.round(endTime / AutoscalerConstants.S2NS);
      const target = transformMetricData(data.resources, basicInfo.interval, startTime, endTime, timezone);
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

export function insertEmptyMetrics(
  data: AppAutoscalerMetricDataPoint[],
  startTime: number,
  endTime: number,
  interval: number,
  timezone?: string
): AppAutoscalerMetricDataPoint[] {
  const insertEmptyNumber = Math.floor((endTime - startTime) / interval) + 1;
  for (let i = 0; i < insertEmptyNumber; i++) {
    const emptyMetric = buildSingleMetricData(startTime + i * interval, 0, timezone);
    if (interval < 0) {
      data.unshift(emptyMetric);
    } else {
      data.push(emptyMetric);
    }
  }
  return data;
}

function buildSingleMetricData(timestamp: number, value: number | string, timezone: string): AppAutoscalerMetricDataPoint {
  const name = (() => {
    if (timezone) {
      return moment(timestamp * 1000).tz(timezone).format(AutoscalerConstants.MomentFormateTimeS);
    } else {
      return moment(timestamp * 1000).format(AutoscalerConstants.MomentFormateTimeS);
    }
  })();
  return {
    time: timestamp,
    name,
    value
  };
}

function transformMetricData(
  source: AppAutoscalerMetricData[],
  interval: number,
  startTime: number,
  endTime: number,
  timezone: string): AppAutoscalerMetricDataPoint[] {
  if (source.length === 0) {
    return [];
  }
  const scope = Math.round(interval / 2);
  const target: AppAutoscalerMetricDataPoint[] = [];
  let targetTimestamp = Math.round(source[0].timestamp / AutoscalerConstants.S2NS);
  let targetIndex = insertEmptyMetrics(target, targetTimestamp - interval, startTime, -interval, timezone).length;
  let sourceIndex = 0;
  while (sourceIndex < source.length) {
    if (!target[targetIndex]) {
      target[targetIndex] = buildSingleMetricData(targetTimestamp, 0, timezone);
    }
    const metric = source[sourceIndex];
    const sourceTimestamp = Math.round(metric.timestamp / AutoscalerConstants.S2NS);
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
  return insertEmptyMetrics(target, target[targetIndex].time + interval, endTime, interval, timezone);
}

function buildMetricColorData(metricData: AppAutoscalerMetricDataPoint[], trigger: AppScalingTrigger): AppAutoscalerMetricDataPoint[] {
  const colorTarget: AppAutoscalerMetricDataPoint[] = [];
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

function buildSingleColor(lineChartSeries: AppAutoscalerMetricDataPoint[], ul: AppScalingRule[]) {
  ul.forEach((item) => {
    const lineData = {
      name: buildTriggerName(item),
      value: item.color
    };
    lineChartSeries.push(lineData);
  });
}

function buildMarkLineData(metricData, trigger: AppScalingTrigger): AppAutoscalerMetricDataLine[] {
  const lineChartSeries: AppAutoscalerMetricDataLine[] = [];
  if (trigger.upper && trigger.upper.length > 0) {
    buildSingleMarkLine(lineChartSeries, metricData, trigger.upper);
  }
  if (trigger.lower && trigger.lower.length > 0) {
    buildSingleMarkLine(lineChartSeries, metricData, trigger.lower);
  }
  return lineChartSeries;
}

function buildTriggerName(item: AppScalingRule): string {
  const type = getScaleType(item.operator);
  return `${type} threshold: ${item.operator} ${item.threshold}`;
}

function buildSingleMarkLine(lineChartSeries: AppAutoscalerMetricDataLine[], metricData: AppAutoscalerMetricData[], ul: AppScalingRule[]) {
  ul.forEach(item => {
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

function executeCompare(val1: number, operator: string, val2: number): boolean {
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

function getColor(trigger: AppScalingTrigger, value: any): string {
  let color = AutoscalerConstants.normalColor;
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

function getMetricBasicInfo(
  metricName: string,
  source: AppAutoscalerMetricData[],
  trigger: AppScalingTrigger
): AppAutoscalerMetricBasicInfo {
  const map = {};
  let interval = AutoscalerConstants.metricMap[metricName].interval;
  let maxCount = 1;
  let preTimestamp = 0;
  let maxValue = -1;
  const unit = AutoscalerConstants.metricMap[metricName].unit_internal;
  map[interval] = 1;
  for (const item of source) {
    maxValue = Math.max(Number(item.value), maxValue);
    const thisTimestamp = Math.round(item.timestamp / AutoscalerConstants.S2NS);
    const currentInterval = thisTimestamp - preTimestamp;
    map[currentInterval] = map[currentInterval] ? map[currentInterval] + 1 : 1;
    if (map[currentInterval] > maxCount) {
      interval = currentInterval;
      maxCount = map[currentInterval];
    }
    preTimestamp = thisTimestamp;
    // unit = item.unit === '' ? unit : item.unit;
  }
  return {
    interval,
    unit,
    chartMaxValue: getChartMax(trigger, maxValue)
  };
}

function getChartMax(trigger: AppScalingTrigger, maxValue: number): number {
  let thresholdCount = 0;
  let maxThreshold = 0;
  let thresholdmax = 0;
  let metricType = '';
  if (trigger.upper && trigger.upper.length > 0) {
    thresholdCount += trigger.upper.length;
    maxThreshold = trigger.upper[0].threshold;
    metricType = trigger.upper[0].metric_type;
  }
  if (trigger.lower && trigger.lower.length > 0) {
    thresholdCount += trigger.lower.length;
    maxThreshold = Math.max(trigger.lower[0].threshold, maxThreshold);
    metricType = trigger.lower[0].metric_type;
  }
  if (AutoscalerConstants.MetricPercentageTypes.indexOf(metricType) >= 0) {
    return 100;
  }
  if (maxThreshold > 0) {
    thresholdmax = Math.ceil(maxThreshold * (thresholdCount + 1) / (thresholdCount));
  }
  thresholdmax = Math.max(maxValue, thresholdmax, 10);
  thresholdmax = getTrimmedInteger(thresholdmax);
  return thresholdmax;
}

function getTrimmedInteger(thresholdmax: number): number {
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
