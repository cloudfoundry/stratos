(function () {
  'use strict';

  describe('application state service', function () {
    var $httpBackend, applicationModel, appStateService;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');
      appStateService = $injector.get('cloud-foundry.model.application.stateService');
      applicationModel = modelManager.retrieve('cloud-foundry.model.application');
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('getAppSummary', function () {
      expect(appStateService).not.toBe(null);
    });
  });

})();
