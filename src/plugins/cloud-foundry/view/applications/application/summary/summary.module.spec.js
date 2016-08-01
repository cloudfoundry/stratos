(function () {
  'use strict';

  describe('summary view', function () {

    var $controller;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      var modelManager = $injector.get('app.model.modelManager');
      var $stateParams = $injector.get('$stateParams');
      var $state = $injector.get('$state');

      var ApplicationSummaryController = $state.get('cf.applications.application.summary').controller;
      $controller = new ApplicationSummaryController(modelManager, $stateParams);
      expect($controller).toBeDefined();
      expect($controller).not.toBe(null);
      expect($controller.isWebLink).toBeDefined();
    }));

    describe('buildpack links', function () {
      beforeEach(function () {
        expect($controller.isWebLink).toBeDefined();
      });

      it('http buildpack is a web link', function () {
        expect($controller.isWebLink('http://www.test.com')).toBe(true);
        expect($controller.isWebLink('  http://www.test.com')).toBe(true);
      });

      it('https buildpack is a web link', function () {
        expect($controller.isWebLink('https://www.test.com')).toBe(true);
        expect($controller.isWebLink(' https://www.test.com')).toBe(true);
      });

      it('empty buildpack is not a web link', function () {
        expect($controller.isWebLink('')).toBe(false);
        expect($controller.isWebLink(' ')).toBe(false);
        expect($controller.isWebLink(undefined)).toBe(false);
        expect($controller.isWebLink(null)).toBe(false);
      });

      it('name buildpack is not a web link', function () {
        expect($controller.isWebLink('name')).toBe(false);
        expect($controller.isWebLink(' name')).toBe(false);
      });

    });

    describe('format uptime', function () {
      beforeEach(function () {
        expect($controller.formatUptime).toBeDefined();
      });

      it('formats undefined and null correctly', function () {
        expect($controller.formatUptime(null)).toBe('-');
        expect($controller.formatUptime(undefined)).toBe('-');
      });

      it('formats 0 correctly', function () {
        expect($controller.formatUptime(0)).toBe('0 seconds');
      });

      it('formats 1 correctly', function () {
        expect($controller.formatUptime(1)).toBe('1 second');
      });

      it('formats day uptime correctly', function () {
        expect($controller.formatUptime(86400)).toBe('1 day');
        expect($controller.formatUptime(172800)).toBe('2 days');
      });

      it('formats mixed uptime correctly', function () {
        expect($controller.formatUptime(3661)).toBe('1 hour 1 minute 1 second');
        expect($controller.formatUptime(3665)).toBe('1 hour 1 minute 5 seconds');
        expect($controller.formatUptime(7200)).toBe('2 hours');
        expect($controller.formatUptime(7320)).toBe('2 hours 2 minutes');
        expect($controller.formatUptime(172800 + 7321)).toBe('2 days 2 hours 2 minutes 1 second');
        expect($controller.formatUptime(172800 + 7327)).toBe('2 days 2 hours 2 minutes 7 seconds');
      });

    });
  });

})();
