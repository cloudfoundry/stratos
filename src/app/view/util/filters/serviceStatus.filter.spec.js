(function () {
  'use strict';

  describe('serviceStatus filter', function () {
    var serviceStatusFilter;

    beforeEach(module('app.view'));
    beforeEach(inject(function ($injector) {
      serviceStatusFilter = $injector.get('serviceStatusFilter');
    }));

    it('should return HTML markup for OK icon when status === `OK`', function () {
      var html = '<span class="helion-icon helion-icon-lg helion-icon-Active_L text-primary"></span>';
      expect(serviceStatusFilter('OK')).toBe(html);
    });

    it('should return HTML markup for DANGER icon when status === `ERROR`', function () {
      var html = '<span class="helion-icon helion-icon-lg helion-icon-Critical_L text-danger"></span>';
      expect(serviceStatusFilter('ERROR')).toBe(html);
    });

    it('should return HTML markup for UNKNOWN icon by default', function () {
      var html = '<span class="helion-icon helion-icon-lg helion-icon-Unknown_L"></span>';
      expect(serviceStatusFilter('FOO')).toBe(html);
    });

    it('should return no HTML markup if status is undefined', function () {
      expect(serviceStatusFilter(undefined)).toBe('');
    });
  });

})();
