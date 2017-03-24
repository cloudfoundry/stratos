(function () {
  'use strict';

  describe('Filter: max', function () {
    var maxFilter;

    beforeEach(module('helion.framework.filters'));
    beforeEach(inject(function (_maxFilter_) {
      maxFilter = _maxFilter_;
    }));

    it('should find the max of 2 integers', function () {
      expect(maxFilter(2, 3)).toBe(3);
    });

    it('should find the max of 2 integers regardless of order', function () {
      expect(maxFilter(3, 2)).toBe(3);
    });

    it('should find the max of negative numbers', function () {
      expect(maxFilter(-42, -12.121212)).toBe(-12.121212);
    });

    it('should find the max of many numbers', function () {
      expect(maxFilter(-3, 0, 9, 2.718, -99)).toBe(9);
    });

    it('should find the "max" of one number', function () {
      expect(maxFilter(3.14159265358979323846264)).toBe(3.14159265358979323846264);
    });

    it('should find the "max" of two strings based on ASCII values', function () {
      expect(maxFilter('a', 'z', 'A', 'Z')).toBe('z');
    });

    it('should find the max array based on a per-element comparison', function () {
      expect(maxFilter([1, 2, 3], [4, 5])).toEqual([4, 5]);
    });
  });
})();
