(function () {
  'use strict';

  describe('appStateIcon filter', function () {
    var appStateIconFilter;

    beforeEach(module('console-app'));
    beforeEach(inject(function ($injector) {
      appStateIconFilter = $injector.get('appStateIconFilter');
    }));

    it('should return `app-status-icon-ok text-success` for STARTED', function () {
      var classes = 'app-status-icon-ok text-success';
      expect(appStateIconFilter('STARTED')).toBe(classes);
    });

    it('should return `app-status-icon-warning text-danger` for STOPPED', function () {
      var classes = 'app-status-icon-warning text-danger';
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
      var classes = 'app-status-icon-ok text-success';
      expect(appStateIconFilter('ok')).toBe(classes);
    });

    it('should return icon for warning', function () {
      var classes = 'app-status-icon-warning text-warning';
      expect(appStateIconFilter('warning')).toBe(classes);
    });

    it('should return icon for error', function () {
      var classes = 'app-status-icon-error text-danger';
      expect(appStateIconFilter('error')).toBe(classes);
    });
  });

})();
