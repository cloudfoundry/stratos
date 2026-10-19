import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect } from 'vitest';
import {
  AutoscalerConstants, autoscalerErrorMessage, isEqual, buildLegendData, shiftArray,
} from './autoscaler-util';

describe('Autoscaler Util Helper', () => {
  it('buildLegendData', () => {
    const trigger = {
      lower: [
        {
          adjustment: '-1',
          breach_duration_secs: 60,
          cool_down_secs: 60,
          metric_type: 'throughput',
          operator: '<=',
          threshold: 5,
          color: 'rgba(51, 204, 255, 0.6)'
        }
      ],
      upper: [
        {
          adjustment: '+2',
          breach_duration_secs: 60,
          cool_down_secs: 60,
          metric_type: 'throughput',
          operator: '>',
          threshold: 20,
          color: 'rgba(255, 0, 0, 0.6)'
        },
        {
          adjustment: '+1',
          breach_duration_secs: 60,
          cool_down_secs: 60,
          metric_type: 'throughput',
          operator: '>',
          threshold: 10,
          color: 'rgba(255, 128, 0, 0.6)'
        }
      ],
      query: {
        metric: 'policy',
        params: {
          start: 1557026400,
          end: 1557026880,
          step: 9.6,
        }
      }
    };
    const expectedLegend = [
      {
        name: 'throughput > 20',
        value: 'rgba(255, 0, 0, 0.6)'
      },
      {
        name: '10 < throughput <= 20',
        value: 'rgba(255, 128, 0, 0.6)'
      },
      {
        name: '5 < throughput <= 10',
        value: 'rgba(90,167,0,0.6)'
      },
      {
        name: 'throughput <= 5',
        value: 'rgba(51, 204, 255, 0.6)'
      }
    ];
    const legend = buildLegendData(trigger);
    expect(isEqual(expectedLegend, legend)).toBe(true);
  });
  it('shiftArray', () => {
    expect(shiftArray([0, 2, 3], 1)).toEqual([1, 3, 4]);
    expect(shiftArray([1, 6, 9], -1)).toEqual([0, 5, 8]);
  });
  // The built-in metrics of autoscaler 14.x and 15.x, with the threshold
  // limits it enforces by default.
  it('knows every built-in metric and its threshold limit', () => {
    expect(AutoscalerConstants.MetricTypes).toEqual(
      expect.arrayContaining(['memoryused', 'memoryutil', 'responsetime', 'throughput', 'cpu', 'cpuutil', 'disk', 'diskutil']));
    expect(AutoscalerConstants.getMetricThresholdMax('cpuutil')).toBe(100);
    expect(AutoscalerConstants.getMetricThresholdMax('diskutil')).toBe(100);
    expect(AutoscalerConstants.getMetricThresholdMax('disk')).toBe(2048);
    expect(AutoscalerConstants.getMetricThresholdMax('memoryused')).toBeUndefined();
    expect(AutoscalerConstants.getMetricUnit('disk')).toBe('MB');
  });
  it('autoscalerErrorMessage', () => {
    const refusal = new HttpErrorResponse({ status: 403, error: { error: 'The application is not bound to Auto-Scaling service' } });
    expect(autoscalerErrorMessage(refusal)).toBe('The application is not bound to Auto-Scaling service');
    const other = new HttpErrorResponse({ status: 500, error: 'boom', url: '/x' });
    expect(autoscalerErrorMessage(other)).toBe(other.message);
  });
  // The other shapes the autoscaler (14.x and 15.x) answers with.
  it('autoscalerErrorMessage reads every autoscaler error shape', () => {
    const coded = new HttpErrorResponse({ status: 404, error: { code: 'Not Found', message: 'Policy Not Found' } });
    expect(autoscalerErrorMessage(coded)).toBe('Policy Not Found');
    const decode = new HttpErrorResponse({ status: 400, error: { error_message: 'decode params: query: "order": invalid value' } });
    expect(autoscalerErrorMessage(decode)).toBe('decode params: query: "order": invalid value');
    const invalidPolicy = new HttpErrorResponse({
      status: 400, error: [
        { context: '(root).scaling_rules.0.breach_duration_secs', description: 'Must be greater than or equal to 60' },
        { context: '(root)', description: 'instance_min_count is required' },
      ]
    });
    expect(autoscalerErrorMessage(invalidPolicy)).toBe(
      'scaling_rules.0.breach_duration_secs: Must be greater than or equal to 60; instance_min_count is required');
  });
});
