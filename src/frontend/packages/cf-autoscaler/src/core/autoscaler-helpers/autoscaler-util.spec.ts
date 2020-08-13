import {
  isEqual, buildLegendData, shiftArray
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
          step: 9.6
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
});
