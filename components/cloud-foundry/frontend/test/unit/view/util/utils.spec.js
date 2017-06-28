(function () {
  'use strict';

  describe('cfUtilsService', function () {
    var cfUtilsService;

    beforeEach(module('console-app'));
    beforeEach(inject(function ($injector) {
      cfUtilsService = $injector.get('cfUtilsService');
    }));

    describe('format uptime', function () {
      beforeEach(function () {
        expect(cfUtilsService.formatUptime).toBeDefined();
      });

      it('formats undefined and null correctly', function () {
        expect(cfUtilsService.formatUptime(null)).toBe('-');
        expect(cfUtilsService.formatUptime(undefined)).toBe('-');
      });

      it('formats 0 correctly', function () {
        expect(cfUtilsService.formatUptime(0)).toBe('0s');
      });

      it('formats 1 correctly', function () {
        expect(cfUtilsService.formatUptime(1)).toBe('1s');
      });

      it('formats day uptime correctly', function () {
        expect(cfUtilsService.formatUptime(86400)).toBe('1d');
        expect(cfUtilsService.formatUptime(172800)).toBe('2d');
      });

      it('formats mixed uptime correctly', function () {
        expect(cfUtilsService.formatUptime(3661)).toBe('1h 1m 1s');
        expect(cfUtilsService.formatUptime(3665)).toBe('1h 1m 5s');
        expect(cfUtilsService.formatUptime(7200)).toBe('2h');
        expect(cfUtilsService.formatUptime(7320)).toBe('2h 2m');
        expect(cfUtilsService.formatUptime(172800 + 7321)).toBe('2d 2h 2m 1s');
        expect(cfUtilsService.formatUptime(172800 + 7327)).toBe('2d 2h 2m 7s');
      });
    });
  });
})();
