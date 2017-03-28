(function () {
  'use strict';

  describe('Filter: percentage', function () {
    var percentageFilter;

    beforeEach(module('helion.framework.filters'));
    beforeEach(inject(function (_percentageFilter_) {
      percentageFilter = _percentageFilter_;
    }));

    it('should return a percent string', function () {
      expect(percentageFilter(0.42)).toBe('42%');
    });

    it('should handle 0 percent correctly', function () {
      expect(percentageFilter(0)).toBe('0%');
    });

    it('should handle 100 percent correctly', function () {
      expect(percentageFilter(1)).toBe('100%');
    });

    it('should handle inputs larger than 1', function () {
      expect(percentageFilter(1.5)).toBe('150%');
    });

    it('should handle negative inputs', function () {
      expect(percentageFilter(-0.15)).toBe('-15%');
    });

    it('should round numbers to the 1 percent by default', function () {
      expect(percentageFilter(0.123456789)).toBe('12%');
    });

    it('should round numbers to a specified level', function () {
      expect(percentageFilter(0.123456789, 2)).toBe('12.35%');
    });

    it('should display right pad with 0s if necessary', function () {
      expect(percentageFilter(0.42, 4)).toBe('42.0000%');
    });

    it('should return "" for non-numeric inputs', function () {
      expect(percentageFilter('yo')).toBe('');
      expect(percentageFilter([1, 2])).toBe('');
      expect(percentageFilter({})).toBe('');
    });
  });
})();
