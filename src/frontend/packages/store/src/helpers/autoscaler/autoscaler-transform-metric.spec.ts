import {
  isEqual
} from './autoscaler-util';
import {
  insertEmptyMetrics
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
});
