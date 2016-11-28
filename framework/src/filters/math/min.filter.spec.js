(function () {
  'use strict';

  describe('Filter: min', function () {
    var minFilter;

    beforeEach(module('helion.framework.filters'));
    beforeEach(inject(function (_minFilter_) {
      minFilter = _minFilter_;
    }));

    it('should find the min of 2 integers', function () {
      expect(minFilter(2, 3)).toBe(2);
    });

    it('should find the min of 2 integers regardless of order', function () {
      expect(minFilter(3, 2)).toBe(2);
    });

    it('should find the min of negative numbers', function () {
      expect(minFilter(-42, -12.121212)).toBe(-42);
    });

    it('should find the min of many numbers', function () {
      expect(minFilter(-3, 0, 9, 2.718, -99)).toBe(-99);
    });

    it('should find the "min" of one number', function () {
      expect(minFilter(3.14159265358979323846264)).toBe(3.14159265358979323846264);
    });

    it('should find the "min" of two strings based on ASCII values', function () {
      expect(minFilter('a', 'z', 'A', 'Z')).toBe('A');
    });

    it('should find the min array based on a per-element comparison', function () {
      expect(minFilter([1, 2, 3], [4, 5])).toEqual([1, 2, 3]);
    });
  });
})();
