import { isEqual } from './autoscaler-util';
import {
  autoscalerTransformArrayToMap,
  autoscalerTransformMapToArray,
} from './autoscaler-transform-policy';
import { AppAutoscalerPolicy, AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';

describe('Autoscaler Transform Policy Helper', () => {
  it('Test policy transformation', () => {
    const arrayPolicy: AppAutoscalerPolicy = {
      instance_min_count: 1,
      instance_max_count: 10,
      scaling_rules: [
        {
          metric_type: 'memoryused',
          breach_duration_secs: 600,
          threshold: 10,
          operator: '<=',
          cool_down_secs: 300,
          adjustment: '-2'
        },
        {
          metric_type: 'memoryused',
          breach_duration_secs: 600,
          threshold: 30,
          operator: '<',
          cool_down_secs: 300,
          adjustment: '-1'
        },
        {
          metric_type: 'memoryused',
          breach_duration_secs: 600,
          threshold: 120,
          operator: '>',
          cool_down_secs: 300,
          adjustment: '+3'
        },
        {
          metric_type: 'memoryused',
          breach_duration_secs: 600,
          threshold: 90,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+2'
        },
        {
          metric_type: 'memoryused',
          breach_duration_secs: 600,
          threshold: 200,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+4'
        },
        {
          metric_type: 'memoryutil',
          breach_duration_secs: 600,
          threshold: 20,
          operator: '<',
          cool_down_secs: 300,
          adjustment: '-3'
        },
        {
          metric_type: 'responsetime',
          breach_duration_secs: 600,
          threshold: 50,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+4'
        },
        {
          metric_type: 'responsetime',
          breach_duration_secs: 600,
          threshold: 40,
          operator: '<',
          cool_down_secs: 300,
          adjustment: '-5'
        },
        {
          metric_type: 'memoryutil',
          breach_duration_secs: 600,
          threshold: 90,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+6'
        }
      ],
      schedules: {
        timezone: 'Asia/Shanghai',
        recurring_schedule: [
          {
            start_time: '10:00',
            end_time: '18:00',
            days_of_week: [
              1,
              2,
              3
            ],
            instance_min_count: 1,
            instance_max_count: 10,
            initial_min_instance_count: 5
          },
          {
            start_date: '2099-06-27',
            end_date: '2099-07-23',
            start_time: '11:00',
            end_time: '19:30',
            days_of_month: [
              5,
              15,
              25
            ],
            instance_min_count: 3,
            instance_max_count: 10
          }
        ],
        specific_date: [
          {
            start_date_time: '2099-06-02T10:00',
            end_date_time: '2099-06-15T13:59',
            instance_min_count: 1,
            instance_max_count: 4,
            initial_min_instance_count: 2
          },
          {
            start_date_time: '2099-01-04T20:00',
            end_date_time: '2099-02-19T23:15',
            instance_min_count: 2,
            instance_max_count: 5
          }
        ]
      }
    };
    const { ...mapPolicy }: AppAutoscalerPolicyLocal = {
      ...arrayPolicy,
      enabled: true,
      scaling_rules_map: {
        memoryused: {
          lower: [
            {
              metric_type: 'memoryused',
              breach_duration_secs: 600,
              threshold: 30,
              operator: '<',
              cool_down_secs: 300,
              adjustment: '-1',
              color: 'rgba(51, 204, 255, 0.6)'
            },
            {
              metric_type: 'memoryused',
              breach_duration_secs: 600,
              threshold: 10,
              operator: '<=',
              cool_down_secs: 300,
              adjustment: '-2',
              color: 'rgba(51, 136, 255, 0.6)'
            }
          ],
          upper: [
            {
              metric_type: 'memoryused',
              breach_duration_secs: 600,
              threshold: 200,
              operator: '>=',
              cool_down_secs: 300,
              adjustment: '+4',
              color: 'rgba(255, 0, 0, 0.6)'
            },
            {
              metric_type: 'memoryused',
              breach_duration_secs: 600,
              threshold: 120,
              operator: '>',
              cool_down_secs: 300,
              adjustment: '+3',
              color: 'rgba(255, 85, 0, 0.6)'
            },
            {
              metric_type: 'memoryused',
              breach_duration_secs: 600,
              threshold: 90,
              operator: '>=',
              cool_down_secs: 300,
              adjustment: '+2',
              color: 'rgba(255, 170, 0, 0.6)'
            }
          ]
        },
        memoryutil: {
          lower: [
            {
              metric_type: 'memoryutil',
              breach_duration_secs: 600,
              threshold: 20,
              operator: '<',
              cool_down_secs: 300,
              adjustment: '-3',
              color: 'rgba(51, 204, 255, 0.6)'
            }
          ],
          upper: [
            {
              metric_type: 'memoryutil',
              breach_duration_secs: 600,
              threshold: 90,
              operator: '>=',
              cool_down_secs: 300,
              adjustment: '+6',
              color: 'rgba(255, 0, 0, 0.6)'
            }
          ]
        },
        responsetime: {
          upper: [
            {
              metric_type: 'responsetime',
              breach_duration_secs: 600,
              threshold: 50,
              operator: '>=',
              cool_down_secs: 300,
              adjustment: '+4',
              color: 'rgba(255, 0, 0, 0.6)'
            }
          ],
          lower: [
            {
              metric_type: 'responsetime',
              breach_duration_secs: 600,
              threshold: 40,
              operator: '<',
              cool_down_secs: 300,
              adjustment: '-5',
              color: 'rgba(51, 204, 255, 0.6)'
            }
          ]
        }
      },
      scaling_rules_form: [
        {
          metric_type: 'memoryused',
          breach_duration_secs: 600,
          threshold: 200,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+4',
          color: 'rgba(255, 0, 0, 0.6)'
        },
        {
          metric_type: 'memoryused',
          breach_duration_secs: 600,
          threshold: 120,
          operator: '>',
          cool_down_secs: 300,
          adjustment: '+3',
          color: 'rgba(255, 85, 0, 0.6)'
        },
        {
          metric_type: 'memoryused',
          breach_duration_secs: 600,
          threshold: 90,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+2',
          color: 'rgba(255, 170, 0, 0.6)'
        },
        {
          metric_type: 'memoryused',
          breach_duration_secs: 600,
          threshold: 30,
          operator: '<',
          cool_down_secs: 300,
          adjustment: '-1',
          color: 'rgba(51, 204, 255, 0.6)'
        },
        {
          metric_type: 'memoryused',
          breach_duration_secs: 600,
          threshold: 10,
          operator: '<=',
          cool_down_secs: 300,
          adjustment: '-2',
          color: 'rgba(51, 136, 255, 0.6)'
        },
        {
          metric_type: 'memoryutil',
          breach_duration_secs: 600,
          threshold: 90,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+6',
          color: 'rgba(255, 0, 0, 0.6)'
        },
        {
          metric_type: 'memoryutil',
          breach_duration_secs: 600,
          threshold: 20,
          operator: '<',
          cool_down_secs: 300,
          adjustment: '-3',
          color: 'rgba(51, 204, 255, 0.6)'
        },
        {
          metric_type: 'responsetime',
          breach_duration_secs: 600,
          threshold: 50,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+4',
          color: 'rgba(255, 0, 0, 0.6)'
        },
        {
          metric_type: 'responsetime',
          breach_duration_secs: 600,
          threshold: 40,
          operator: '<',
          cool_down_secs: 300,
          adjustment: '-5',
          color: 'rgba(51, 204, 255, 0.6)'
        }
      ]
    };
    const mapPolicyFromArray = autoscalerTransformArrayToMap(arrayPolicy);
    const arrayPolicyFromMap = autoscalerTransformMapToArray(mapPolicy);
    expect(isEqual(mapPolicyFromArray, mapPolicy)).toBe(true);
    expect(isEqual(arrayPolicyFromMap, autoscalerTransformMapToArray(autoscalerTransformArrayToMap(arrayPolicy)))).toBe(true);
    delete arrayPolicy.scaling_rules;
    mapPolicy.scaling_rules_form = [];
    expect(isEqual(arrayPolicy, autoscalerTransformMapToArray(mapPolicy))).toBe(true);
  });
});
