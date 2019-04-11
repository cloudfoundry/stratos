import {
  isEqual
} from './autoscaler-util';
import {
  autoscalerTransformArrayToMap,
  autoscalerTransformMapToArray,
  isPolicyMapEqual
} from './autoscaler-transform-policy';

describe('Autoscaler Transform Policy Helper', () => {
  it('Test policy transformation', () => {
    const arrayPolicy = {
      instance_min_count: 1,
      instance_max_count: 10,
      scaling_rules: [
        {
          metric_type: 'memoryused',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 10,
          operator: '<=',
          cool_down_secs: 300,
          adjustment: '-2'
        },
        {
          metric_type: 'memoryused',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 30,
          operator: '<',
          cool_down_secs: 300,
          adjustment: '-1'
        },
        {
          metric_type: 'memoryused',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 120,
          operator: '>',
          cool_down_secs: 300,
          adjustment: '+3'
        },
        {
          metric_type: 'memoryused',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 90,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+2'
        },
        {
          metric_type: 'memoryused',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 200,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+4'
        },
        {
          metric_type: 'memoryutil',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 20,
          operator: '<',
          cool_down_secs: 300,
          adjustment: '-3'
        },
        {
          metric_type: 'responsetime',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 50,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+4'
        },
        {
          metric_type: 'responsetime',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 40,
          operator: '<',
          cool_down_secs: 300,
          adjustment: '-5'
        },
        {
          metric_type: 'memoryutil',
          stat_window_secs: 300,
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
            instance_max_count: 10,
            initial_min_instance_count: 5
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
            instance_max_count: 5,
            initial_min_instance_count: 3
          }
        ]
      }
    };
    const mapPolicy = {
      instance_min_count: 1,
      instance_max_count: 10,
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
            instance_max_count: 10,
            initial_min_instance_count: 5
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
            instance_max_count: 5,
            initial_min_instance_count: 3
          }
        ]
      },
      scaling_rules_map: {
        memoryused: {
          lower: [
            {
              metric_type: 'memoryused',
              stat_window_secs: 300,
              breach_duration_secs: 600,
              threshold: 30,
              operator: '<',
              cool_down_secs: 300,
              adjustment: '-1',
              expand: false
            },
            {
              metric_type: 'memoryused',
              stat_window_secs: 300,
              breach_duration_secs: 600,
              threshold: 10,
              operator: '<=',
              cool_down_secs: 300,
              adjustment: '-2',
              expand: false
            }
          ],
          upper: [
            {
              metric_type: 'memoryused',
              stat_window_secs: 300,
              breach_duration_secs: 600,
              threshold: 200,
              operator: '>=',
              cool_down_secs: 300,
              adjustment: '+4',
              expand: false
            },
            {
              metric_type: 'memoryused',
              stat_window_secs: 300,
              breach_duration_secs: 600,
              threshold: 120,
              operator: '>',
              cool_down_secs: 300,
              adjustment: '+3',
              expand: false
            },
            {
              metric_type: 'memoryused',
              stat_window_secs: 300,
              breach_duration_secs: 600,
              threshold: 90,
              operator: '>=',
              cool_down_secs: 300,
              adjustment: '+2',
              expand: false
            }
          ]
        },
        memoryutil: {
          lower: [
            {
              metric_type: 'memoryutil',
              stat_window_secs: 300,
              breach_duration_secs: 600,
              threshold: 20,
              operator: '<',
              cool_down_secs: 300,
              adjustment: '-3',
              expand: false
            }
          ],
          upper: [
            {
              metric_type: 'memoryutil',
              stat_window_secs: 300,
              breach_duration_secs: 600,
              threshold: 90,
              operator: '>=',
              cool_down_secs: 300,
              adjustment: '+6',
              expand: false
            }
          ]
        },
        responsetime: {
          upper: [
            {
              metric_type: 'responsetime',
              stat_window_secs: 300,
              breach_duration_secs: 600,
              threshold: 50,
              operator: '>=',
              cool_down_secs: 300,
              adjustment: '+4',
              expand: false
            }
          ],
          lower: [
            {
              metric_type: 'responsetime',
              stat_window_secs: 300,
              breach_duration_secs: 600,
              threshold: 40,
              operator: '<',
              cool_down_secs: 300,
              adjustment: '-5',
              expand: false
            }
          ]
        }
      },
      scaling_rules_form: [
        {
          metric_type: 'memoryused',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 200,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+4',
          expand: false
        },
        {
          metric_type: 'memoryused',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 120,
          operator: '>',
          cool_down_secs: 300,
          adjustment: '+3',
          expand: false
        },
        {
          metric_type: 'memoryused',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 90,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+2',
          expand: false
        },
        {
          metric_type: 'memoryused',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 30,
          operator: '<',
          cool_down_secs: 300,
          adjustment: '-1',
          expand: false
        },
        {
          metric_type: 'memoryused',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 10,
          operator: '<=',
          cool_down_secs: 300,
          adjustment: '-2',
          expand: false
        },
        {
          metric_type: 'memoryutil',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 90,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+6',
          expand: false
        },
        {
          metric_type: 'memoryutil',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 20,
          operator: '<',
          cool_down_secs: 300,
          adjustment: '-3',
          expand: false
        },
        {
          metric_type: 'responsetime',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 50,
          operator: '>=',
          cool_down_secs: 300,
          adjustment: '+4',
          expand: false
        },
        {
          metric_type: 'responsetime',
          stat_window_secs: 300,
          breach_duration_secs: 600,
          threshold: 40,
          operator: '<',
          cool_down_secs: 300,
          adjustment: '-5',
          expand: false
        }
      ]
    };
    const mapPolicyFromArray = autoscalerTransformArrayToMap(arrayPolicy);
    const arrayPolicyFromMap = autoscalerTransformMapToArray(mapPolicy);
    expect(isEqual(mapPolicyFromArray, mapPolicy)).toBe(true);
    expect(isEqual(arrayPolicyFromMap, autoscalerTransformMapToArray(autoscalerTransformArrayToMap(arrayPolicy)))).toBe(true);
    delete arrayPolicy.scaling_rules;
    expect(isPolicyMapEqual(arrayPolicy, autoscalerTransformArrayToMap(arrayPolicy))).toBe(true);
    delete mapPolicy.scaling_rules_map;
    delete mapPolicy.scaling_rules_form;
    expect(isEqual(mapPolicy, autoscalerTransformMapToArray(mapPolicy))).toBe(true);
  });
});
