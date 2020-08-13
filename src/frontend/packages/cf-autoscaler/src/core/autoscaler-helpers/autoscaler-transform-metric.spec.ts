import {
  isEqual
} from './autoscaler-util';
import {
  insertEmptyMetrics, buildMetricData
} from './autoscaler-transform-metric';

describe('Autoscaler Transform Metric Helper', () => {
  it('insertEmptyMetrics', () => {
    const descTarget = [20, 40, 60, 80, 100];
    const descSource1 = insertEmptyMetrics([], 100, 10, -20);
    descSource1.map((item, index) => {
      expect(isEqual(item.time, descTarget[index])).toBe(true);
    });
    const descSource2 = insertEmptyMetrics([], 100, 20, -20);
    descSource2.map((item, index) => {
      expect(isEqual(item.time, descTarget[index])).toBe(true);
    });
    const ascTarget = [10, 30, 50, 70, 90];
    const ascSource1 = insertEmptyMetrics([], 10, 90, 20);
    ascSource1.map((item, index) => {
      expect(isEqual(item.time, ascTarget[index])).toBe(true);
    });
    const ascSource2 = insertEmptyMetrics([], 10, 100, 20);
    ascSource2.map((item, index) => {
      expect(isEqual(item.time, ascTarget[index])).toBe(true);
    });
  });
  it('buildMetricData', () => {
    const metricName = 'throughput';
    const data = {
      total_results: 12,
      total_pages: 1,
      page: 1,
      prev_url: null,
      next_url: null,
      resources: [
        {
          app_id: '2bd98ff4-99f4-422a-a037-172298277c8b',
          name: 'throughput',
          value: '6',
          unit: 'rps',
          timestamp: 1557026418641445600
        },
        {
          app_id: '2bd98ff4-99f4-422a-a037-172298277c8b',
          name: 'throughput',
          value: '5',
          unit: 'rps',
          timestamp: 1557026457387453200
        },
        {
          app_id: '2bd98ff4-99f4-422a-a037-172298277c8b',
          name: 'throughput',
          value: '5',
          unit: 'rps',
          timestamp: 1557026497600111000
        },
        {
          app_id: '2bd98ff4-99f4-422a-a037-172298277c8b',
          name: 'throughput',
          value: '5',
          unit: 'rps',
          timestamp: 1557026538904853200
        },
        {
          app_id: '2bd98ff4-99f4-422a-a037-172298277c8b',
          name: 'throughput',
          value: '6',
          unit: 'rps',
          timestamp: 1557026577882890500
        },
        {
          app_id: '2bd98ff4-99f4-422a-a037-172298277c8b',
          name: 'throughput',
          value: '8',
          unit: 'rps',
          timestamp: 1557026616931637000
        },
        {
          app_id: '2bd98ff4-99f4-422a-a037-172298277c8b',
          name: 'throughput',
          value: '12',
          unit: 'rps',
          timestamp: 1557026657849241600
        },
        {
          app_id: '2bd98ff4-99f4-422a-a037-172298277c8b',
          name: 'throughput',
          value: '18',
          unit: 'rps',
          timestamp: 1557026697503883000
        },
        {
          app_id: '2bd98ff4-99f4-422a-a037-172298277c8b',
          name: 'throughput',
          value: '21',
          unit: 'rps',
          timestamp: 1557026737224771000
        },
        {
          app_id: '2bd98ff4-99f4-422a-a037-172298277c8b',
          name: 'throughput',
          value: '18',
          unit: 'rps',
          timestamp: 1557026778997745700
        },
        {
          app_id: '2bd98ff4-99f4-422a-a037-172298277c8b',
          name: 'throughput',
          value: '16',
          unit: 'rps',
          timestamp: 1557026817953504800
        },
        {
          app_id: '2bd98ff4-99f4-422a-a037-172298277c8b',
          name: 'throughput',
          value: '14',
          unit: 'rps',
          timestamp: 1557026857236819500
        }
      ]
    };
    const startTime = 1557026400000000000;
    const endTime = 1557026880000000000;
    const skipFormat = false;
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
          step: 9.6
        }
      }
    };
    const expectedResult = {
      latest: {
        target: [
          {
            name: 'throughput',
            value: 14
          }
        ],
        colorTarget: [
          {
            name: 'throughput',
            value: 'rgba(255, 128, 0, 0.6)'
          },
          {
            name: 'upper threshold: > 20',
            value: 'rgba(255, 0, 0, 0.6)'
          },
          {
            name: 'upper threshold: > 10',
            value: 'rgba(255, 128, 0, 0.6)'
          },
          {
            name: 'lower threshold: <= 5',
            value: 'rgba(51, 204, 255, 0.6)'
          }
        ]
      },
      formated: {
        target: [
          {
            time: 1557026419,
            name: '03:20:19',
            value: 6
          },
          {
            time: 1557026458,
            name: '03:20:58',
            value: 5
          },
          {
            time: 1557026497,
            name: '03:21:37',
            value: 5
          },
          {
            time: 1557026536,
            name: '03:22:16',
            value: 5
          },
          {
            time: 1557026575,
            name: '03:22:55',
            value: 6
          },
          {
            time: 1557026614,
            name: '03:23:34',
            value: 8
          },
          {
            time: 1557026653,
            name: '03:24:13',
            value: 12
          },
          {
            time: 1557026692,
            name: '03:24:52',
            value: 18
          },
          {
            time: 1557026731,
            name: '03:25:31',
            value: 21
          },
          {
            time: 1557026770,
            name: '03:26:10',
            value: 18
          },
          {
            time: 1557026809,
            name: '03:26:49',
            value: 16
          },
          {
            time: 1557026848,
            name: '03:27:28',
            value: 14
          }
        ],
        colorTarget: [
          {
            name: '03:20:19',
            value: 'rgba(90,167,0,0.6)'
          },
          {
            name: '03:20:58',
            value: 'rgba(51, 204, 255, 0.6)'
          },
          {
            name: '03:21:37',
            value: 'rgba(51, 204, 255, 0.6)'
          },
          {
            name: '03:22:16',
            value: 'rgba(51, 204, 255, 0.6)'
          },
          {
            name: '03:22:55',
            value: 'rgba(90,167,0,0.6)'
          },
          {
            name: '03:23:34',
            value: 'rgba(90,167,0,0.6)'
          },
          {
            name: '03:24:13',
            value: 'rgba(255, 128, 0, 0.6)'
          },
          {
            name: '03:24:52',
            value: 'rgba(255, 128, 0, 0.6)'
          },
          {
            name: '03:25:31',
            value: 'rgba(255, 0, 0, 0.6)'
          },
          {
            name: '03:26:10',
            value: 'rgba(255, 128, 0, 0.6)'
          },
          {
            name: '03:26:49',
            value: 'rgba(255, 128, 0, 0.6)'
          },
          {
            name: '03:27:28',
            value: 'rgba(255, 128, 0, 0.6)'
          },
          {
            name: 'upper threshold: > 20',
            value: 'rgba(255, 0, 0, 0.6)'
          },
          {
            name: 'upper threshold: > 10',
            value: 'rgba(255, 128, 0, 0.6)'
          },
          {
            name: 'lower threshold: <= 5',
            value: 'rgba(51, 204, 255, 0.6)'
          }
        ]
      },
      markline: [
        {
          name: 'upper threshold: > 20',
          series: [
            {
              name: '03:20:19',
              value: 20
            },
            {
              name: '03:20:58',
              value: 20
            },
            {
              name: '03:21:37',
              value: 20
            },
            {
              name: '03:22:16',
              value: 20
            },
            {
              name: '03:22:55',
              value: 20
            },
            {
              name: '03:23:34',
              value: 20
            },
            {
              name: '03:24:13',
              value: 20
            },
            {
              name: '03:24:52',
              value: 20
            },
            {
              name: '03:25:31',
              value: 20
            },
            {
              name: '03:26:10',
              value: 20
            },
            {
              name: '03:26:49',
              value: 20
            },
            {
              name: '03:27:28',
              value: 20
            }
          ]
        },
        {
          name: 'upper threshold: > 10',
          series: [
            {
              name: '03:20:19',
              value: 10
            },
            {
              name: '03:20:58',
              value: 10
            },
            {
              name: '03:21:37',
              value: 10
            },
            {
              name: '03:22:16',
              value: 10
            },
            {
              name: '03:22:55',
              value: 10
            },
            {
              name: '03:23:34',
              value: 10
            },
            {
              name: '03:24:13',
              value: 10
            },
            {
              name: '03:24:52',
              value: 10
            },
            {
              name: '03:25:31',
              value: 10
            },
            {
              name: '03:26:10',
              value: 10
            },
            {
              name: '03:26:49',
              value: 10
            },
            {
              name: '03:27:28',
              value: 10
            }
          ]
        },
        {
          name: 'lower threshold: <= 5',
          series: [
            {
              name: '03:20:19',
              value: 5
            },
            {
              name: '03:20:58',
              value: 5
            },
            {
              name: '03:21:37',
              value: 5
            },
            {
              name: '03:22:16',
              value: 5
            },
            {
              name: '03:22:55',
              value: 5
            },
            {
              name: '03:23:34',
              value: 5
            },
            {
              name: '03:24:13',
              value: 5
            },
            {
              name: '03:24:52',
              value: 5
            },
            {
              name: '03:25:31',
              value: 5
            },
            {
              name: '03:26:10',
              value: 5
            },
            {
              name: '03:26:49',
              value: 5
            },
            {
              name: '03:27:28',
              value: 5
            }
          ]
        }
      ],
      unit: 'rps',
      chartMaxValue: 30
    };
    const result = buildMetricData(metricName, data, startTime, endTime, skipFormat, trigger, 'UTC');
    expect(isEqual(expectedResult, result)).toBe(true);
  });
});
