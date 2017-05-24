(function () {
  'use strict';

  describe('settings-page module', function () {
    var controller;

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    beforeEach(inject(function ($injector) {
      var $state = $injector.get('$state');
      var appEventService = $injector.get('appEventService');
      var modelManager = $injector.get('modelManager');
      var AboutAppController = $state.get('about-app').controller;
      controller = new AboutAppController(appEventService, modelManager);
    }));

    it('should be defined', function () {
      expect(controller).toBeDefined();
      expect(controller.model).toBeDefined();
      expect(controller.consoleInfo).toBeDefined();
    });
  });

})();
