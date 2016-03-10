(function () {
  'use strict';

  describe('secondsToMs filter', function () {
    var secondsToMsFilter;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      secondsToMsFilter = $injector.get('secondsToMsFilter');
    }));

    it('should return undefined if undefined', function () {
      expect(secondsToMsFilter(undefined)).toBe(null);
    });

    it('should return null if null', function () {
      expect(secondsToMsFilter(null)).toBe(null);
    });

    it('should return `` if ``', function () {
      expect(secondsToMsFilter('')).toBe(null);
    });

    it('should return `string` if `string`', function () {
      expect(secondsToMsFilter('string')).toBe(null);
    });

    it('should return {} if {}', function () {
      expect(secondsToMsFilter({})).toBe(null);
    });

    it('should 1000 ms for 1 second', function () {
      expect(secondsToMsFilter(1)).toBe(1000);
    });
  });

})();
