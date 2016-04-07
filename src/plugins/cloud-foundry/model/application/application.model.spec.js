(function () {
  'use strict';

  describe('cloud-foundry application model', function () {
    var $httpBackend;
    var applicationModel;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');
      applicationModel = modelManager.retrieve('cloud-foundry.model.application');
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('getAppSummary', function () {
      var GetAppSummary = mock.cloudFoundryAPI.Apps.GetAppSummary('123');

      expect(applicationModel.application.summary.state).toBe('LOADING');
      $httpBackend.when('GET', GetAppSummary.url).respond(200, GetAppSummary.response['200'].body);
      $httpBackend.expectGET(GetAppSummary.url);
      applicationModel.getAppSummary('123');
      $httpBackend.flush();
      expect(applicationModel.application.summary.state).toBe('STOPPED');
    });

    it('startApp', function () {
      var GetAppSummary = mock.cloudFoundryAPI.Apps.GetAppSummary('123');
      var UpdateApp = mock.cloudFoundryAPI.Apps.UpdateApp('123', { state: 'STARTED' });

      $httpBackend.when('GET', GetAppSummary.url).respond(200, GetAppSummary.response['200'].body);
      $httpBackend.when('PUT', UpdateApp.url).respond(201, UpdateApp.response['201'].body);
      $httpBackend.expectGET(GetAppSummary.url);
      $httpBackend.expectPUT(UpdateApp.url);
      applicationModel.getAppSummary('123');
      applicationModel.startApp('123');
      $httpBackend.flush();
      expect(applicationModel.appStateSwitchTo).toBe('');
      expect(applicationModel.application.summary.state).toBe('STARTED');
    });

    it('stopApp', function () {
      var GetAppSummary = mock.cloudFoundryAPI.Apps.GetAppSummary('123');
      var UpdateApp = mock.cloudFoundryAPI.Apps.UpdateApp('123', { state: 'STOPPED' });

      $httpBackend.when('GET', GetAppSummary.url).respond(200, GetAppSummary.response['200'].body);
      $httpBackend.when('PUT', UpdateApp.url).respond(201, UpdateApp.response['201'].body);
      $httpBackend.expectGET(GetAppSummary.url);
      $httpBackend.expectPUT(UpdateApp.url);
      applicationModel.getAppSummary('123');
      applicationModel.stopApp('123');
      $httpBackend.flush();
      expect(applicationModel.appStateSwitchTo).toBe('');
      expect(applicationModel.application.summary.state).toBe('STOPPED');
    });

    it('restartApp', function () {
      var GetAppSummary = mock.cloudFoundryAPI.Apps.GetAppSummary('123');
      var UpdateApp = mock.cloudFoundryAPI.Apps.UpdateApp('123', { state: 'STARTED' });

      $httpBackend.when('GET', GetAppSummary.url).respond(200, GetAppSummary.response['200'].body);
      $httpBackend.when('PUT', UpdateApp.url).respond(201, UpdateApp.response['201'].body);
      $httpBackend.expectGET(GetAppSummary.url);
      $httpBackend.expectPUT(UpdateApp.url);
      applicationModel.getAppSummary('123');
      applicationModel.restartApp('123');
      $httpBackend.flush();
      expect(applicationModel.appStateSwitchTo).toBe('');
      expect(applicationModel.application.summary.state).toBe('STARTED');
    });

  });

})();
