(function () {
  'use strict';

  describe('Filter: bytes', function () {
    var bytesFilter;

    beforeEach(module('helion.framework.filters'));
    beforeEach(inject(function (_bytesFilter_) {
      bytesFilter = _bytesFilter_;
    }));

    it('should return a unit of bytes for a number < 1024', function () {
      expect(bytesFilter(42)).toBe('42.0 bytes');
    });

    it('should return a whole-number of bytes if precision is 0', function () {
      expect(bytesFilter(42, 0)).toBe('42 bytes');
    });

    it('should return 2 digits of precision if specified', function () {
      expect(bytesFilter(42, 2)).toBe('42.00 bytes');
    });

    it('should return kb for a number exactly 1024', function () {
      expect(bytesFilter(1024, 0)).toBe('1 kB');
    });

    it('should return a unit of kB for a number between 1024 and 1024^2', function () {
      expect(bytesFilter(4096)).toBe('4.0 kB');
    });

    it('should return a unit of MB for a number between 1024^2 and 1024^3', function () {
      expect(bytesFilter(5.5 * 1024 * 1024)).toBe('5.5 MB');
    });

    it('should return a unit of GB for a number between 1024^3 and 1024^4', function () {
      expect(bytesFilter(6.6 * 1024 * 1024 * 1024)).toBe('6.6 GB');
    });

    it('should return a unit of TB for a number between 1024^4 and 1024^5', function () {
      expect(bytesFilter(7.7 * Math.pow(1024, 4))).toBe('7.7 TB');
    });

    it('should return a unit of PB for a number between 1024^5 and 1024^6', function () {
      expect(bytesFilter(8.8 * Math.pow(1024, 5))).toBe('8.8 PB');
    });

    it('should return 0 bytes for a number of 0', function () {
      expect(bytesFilter(0)).toBe('0.0 bytes');
    });

    it('should return "-" for non-numeric numbers', function () {
      expect(bytesFilter('Broncos > Seahawks')).toBe('-');
    });
  });

  describe('Filter: usageBytes', function () {
    var usageBytesFilter;

    beforeEach(module('helion.framework.filters'));
    beforeEach(inject(function (_usageBytesFilter_) {
      usageBytesFilter = _usageBytesFilter_;
    }));

    it('should return a unit of bytes for a total < 1024', function () {
      expect(usageBytesFilter([1, 42], 0)).toBe('1 / 42 bytes');
    });

    it('should return values with the correct number of digits', function () {
      expect(usageBytesFilter([1, 42])).toBe('1.0 / 42 bytes');
    });

    it('should display the correct precision for the total if specified', function () {
      expect(usageBytesFilter([2, 4], 0, 2)).toBe('2 / 4.00 bytes');
    });

    it('should return a unit of kB for a total between 1024 and 1024^2', function () {
      expect(usageBytesFilter([2048, 4096], 0)).toBe('2 / 4 kB');
    });

    it('should select the unit based on the total', function () {
      expect(usageBytesFilter([512, 4096])).toBe('0.5 / 4 kB');
    });

    it('should handle a used value of zero', function () {
      expect(usageBytesFilter([0, 4096])).toBe('0.0 / 4 kB');
    });

    it('should return "-" for any non-numeric value', function () {
      expect(usageBytesFilter(['Hi there!', 4096])).toBe('-');
      expect(usageBytesFilter([1, 'Oh, hello!'])).toBe('-');
    });

    it('should return "-" if total is zero', function () {
      expect(usageBytesFilter([1, 0])).toBe('-');
    });

    it('should display a unit of MB for a total between 1024^2 and 1024^3', function () {
      expect(usageBytesFilter([2 * Math.pow(1024, 2), 40 * Math.pow(1024, 2)])).toBe('2.0 / 40 MB');
    });

    it('should display a unit of GB for a total between 1024^3 and 1024^4', function () {
      expect(usageBytesFilter([2 * Math.pow(1024, 3), 40 * Math.pow(1024, 3)])).toBe('2.0 / 40 GB');
    });

    it('should display a unit of TB for a total between 1024^4 and 1024^5', function () {
      expect(usageBytesFilter([2 * Math.pow(1024, 4), 40 * Math.pow(1024, 4)])).toBe('2.0 / 40 TB');
    });

    it('should display a unit of PB for a total between 1024^5 and 1024^6', function () {
      expect(usageBytesFilter([2 * Math.pow(1024, 5), 40 * Math.pow(1024, 5)])).toBe('2.0 / 40 PB');
    });

  });
})();
