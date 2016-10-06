(function () {
  'use strict';

  describe('appStateIcon filter', function () {
    var appStateIconFilter;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      appStateIconFilter = $injector.get('appStateIconFilter');
    }));

    it('should return `helion-icon-Active_S text-primary` for STARTED', function () {
      var classes = 'helion-icon-Active_S text-primary';
      expect(appStateIconFilter('STARTED')).toBe(classes);
    });

    it('should return `helion-icon-Critical_S text-danger` for STOPPED', function () {
      var classes = 'helion-icon-Critical_S text-danger';
      expect(appStateIconFilter('STOPPED')).toBe(classes);
    });

    it('should return empty string for PENDING', function () {
      expect(appStateIconFilter('PENDING')).toBe('');
    });

    it('should return empty if status is undefined', function () {
      expect(appStateIconFilter(undefined)).toBe('');
    });

    it('should return empty if status is undefined', function () {
      expect(appStateIconFilter(null)).toBe('');
    });

    it('should return icon for ok', function () {
      var classes = 'helion-icon-Active_S text-primary';
      expect(appStateIconFilter('ok')).toBe(classes);
    });

    it('should return icon for warning', function () {
      var classes = 'helion-icon-Warning_S text-warning';
      expect(appStateIconFilter('warning')).toBe(classes);
    });

    it('should return icon for error', function () {
      var classes = 'helion-icon-Critical_S text-danger';
      expect(appStateIconFilter('error')).toBe(classes);
    });
  });

})();
