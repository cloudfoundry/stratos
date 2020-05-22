import * as moment from 'moment-timezone';

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
import { PaginationResponse } from '../../../../cloud-foundry/src/store/types/cf-api.types';

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
    unit: AutoscalerConstants.getMetricUnit(metricName),
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
  if (trigger.upper.length > 0) {
    buildSingleColor(colorTarget, trigger.upper);
  }
  if (trigger.lower.length > 0) {
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

function buildMarkLineData(metricData: AppAutoscalerMetricDataPoint[], trigger: AppScalingTrigger): AppAutoscalerMetricDataLine[] {
  return buildSingleMarkLine(metricData, trigger.upper).concat(buildSingleMarkLine(metricData, trigger.lower));
}

function buildTriggerName(item: AppScalingRule): string {
  const type = getScaleType(item.operator);
  return `${type} threshold: ${item.operator} ${item.threshold}`;
}

function buildSingleMarkLine(metricData: AppAutoscalerMetricDataPoint[], ul: AppScalingRule[]) {
  return ul.reduce((lineChartSeries, item) => {
    const lineData = {
      name: buildTriggerName(item),
      series: metricData.map((data) => {
        return {
          name: data.name,
          value: item.threshold,
        };
      })
    };
    lineChartSeries.push(lineData);
    return lineChartSeries;
  }, []);
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

function getColorCommon(triggerRules: AppScalingRule[], value: number, isLower?: boolean) {
  for (let i = 0; triggerRules && triggerRules.length > 0 && i < triggerRules.length; i++) {
    const index = isLower ? triggerRules.length - 1 - i : i;
    if (executeCompare(value, triggerRules[index].operator, triggerRules[index].threshold)) {
      return triggerRules[index].color;
    }
  }
  return '';
}

function getColor(trigger: AppScalingTrigger, value: any): string {
  if (Number.isNaN(value)) {
    return AutoscalerConstants.normalColor;
  }
  return getColorCommon(trigger.upper, value) || getColorCommon(trigger.lower, value, true) || AutoscalerConstants.normalColor;
}

function getMetricBasicInfo(
  metricName: string,
  source: AppAutoscalerMetricData[],
  trigger: AppScalingTrigger
): AppAutoscalerMetricBasicInfo {
  const intervalMap = {};
  let maxCount = 1;
  let preTimestamp = 0;
  let maxValue = -1;
  let unit = AutoscalerConstants.getMetricUnit(metricName);
  intervalMap[AutoscalerConstants.getMetricInterval(metricName)] = 1;
  const resultInterval = source.reduce((interval, item) => {
    maxValue = Math.max(Number(item.value), maxValue);
    const thisTimestamp = Math.round(item.timestamp / AutoscalerConstants.S2NS);
    const currentInterval = thisTimestamp - preTimestamp;
    intervalMap[currentInterval] = intervalMap[currentInterval] ? intervalMap[currentInterval] + 1 : 1;
    if (intervalMap[currentInterval] > maxCount) {
      interval = currentInterval;
      maxCount = intervalMap[currentInterval];
    }
    preTimestamp = thisTimestamp;
    unit = item.unit || unit;
    return interval;
  }, AutoscalerConstants.getMetricInterval(metricName));
  return {
    interval: resultInterval,
    unit,
    chartMaxValue: getChartMax(trigger, maxValue, metricName)
  };
}

function getMaxThreshod(rules: AppScalingRule[]) {
  return rules.length > 0 ? rules[0].threshold : 0;
}

function getChartMax(trigger: AppScalingTrigger, maxValue: number, metricName: string): number {
  if (AutoscalerConstants.MetricPercentageTypes.indexOf(metricName) >= 0) {
    return 100;
  }
  const thresholdCount = trigger.upper.length + trigger.lower.length;
  const maxThreshold = Math.max(getMaxThreshod(trigger.upper), getMaxThreshod(trigger.lower));
  const thresholdmax = Math.ceil(maxThreshold * (thresholdCount + 1) / (thresholdCount));
  return getTrimmedInteger(Math.max(maxValue, thresholdmax, 10));
}

function getTrimmedInteger(thresholdmax: number): number {
  for (let i = 10; i < Number.MAX_VALUE && i < thresholdmax; i = i * 10) {
    if (thresholdmax / i >= 1 && thresholdmax / i < 10 && thresholdmax > 100) {
      return (Math.ceil(thresholdmax / i * 10)) * i / 10;
    } else if (thresholdmax / i >= 1 && thresholdmax / i < 10 && thresholdmax <= 100) {
      return (Math.ceil(thresholdmax / i)) * i;
    }
  }
  return thresholdmax;
}
