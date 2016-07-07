(function () {
  'use strict';

  describe('summary view', function () {

    describe('buildpack links', function () {

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
  });

})();
