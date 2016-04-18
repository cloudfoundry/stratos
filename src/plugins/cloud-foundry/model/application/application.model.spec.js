(function () {
  'use strict';

  describe('cloud-foundry application model', function () {
    var $httpBackend, applicationModel;

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

    it('createApp', function () {
      var newAppSpec = Object();
      newAppSpec.name = "myTestApp";
      newAppSpec.space_guid = 'guid-e5ae5698-5796-43c9-ab1a-2cd21306b638';
      var guid = '67eff332-a6e9-4b74-8ee3-608a6fd152b7';
      var CreateApp = mock.cloudFoundryAPI.Apps.CreateApp(newAppSpec);
      var GetAppSummary = mock.cloudFoundryAPI.Apps.GetAppSummary(guid);
      $httpBackend.when('GET', GetAppSummary.url).respond(200, GetAppSummary.response['200'].body);
      $httpBackend.when('POST', CreateApp.url).respond(201, CreateApp.response['201'].body);
      $httpBackend.expectPOST(CreateApp.url);
      $httpBackend.expectGET(GetAppSummary.url);
      applicationModel.create(newAppSpec);
      applicationModel.getAppSummary(guid);
      $httpBackend.flush();
      expect(CreateApp.response['201'].body.entity.name).toBe(newAppSpec.name);
    });

    it('updateApp', function () {
      var newAppSpec = Object();
      newAppSpec.name = "myUpdatedTestApp";
      var guid = "84a911b3-16f7-4f47-afa4-581c86018600";
      var GetAppSummary = mock.cloudFoundryAPI.Apps.GetAppSummary(guid);
      var UpdateApp = mock.cloudFoundryAPI.Apps.UpdateApp(guid, newAppSpec);
      $httpBackend.when('GET', GetAppSummary.url).respond(200, GetAppSummary.response['200'].body);
      $httpBackend.when('PUT', UpdateApp.url).respond(201, UpdateApp.response['201'].body);
      $httpBackend.expectPUT(UpdateApp.url);
      $httpBackend.expectGET(GetAppSummary.url);
      applicationModel.update(guid, newAppSpec);
      applicationModel.getAppSummary(guid);
      $httpBackend.flush();
      expect(UpdateApp.response['201'].body.entity.name).toBe(newAppSpec.name);
      expect(UpdateApp.response['201'].body.metadata.guid).toBe(guid);
    });

    it('getAppStats', function () {
      var guid = "84a911b3-16f7-4f47-afa4-581c86018600";
      var params = {};
      var GetDetailedStatsForStartedApp = mock.cloudFoundryAPI.Apps.GetDetailedStatsForStartedApp(guid);
      $httpBackend.when('GET', GetDetailedStatsForStartedApp.url)
                        .respond(200, GetDetailedStatsForStartedApp.response['200'].body);
      $httpBackend.expectGET(GetDetailedStatsForStartedApp.url);
      applicationModel.getAppStats(guid, params);
      $httpBackend.flush();
      expect(GetDetailedStatsForStartedApp.response['200'].body['0'].state).toBe('RUNNING');
      expect(applicationModel.application.stats['0'].stats.usage.disk).toBe(66392064);
    });
  });

})();
