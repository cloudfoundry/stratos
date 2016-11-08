(function () {
  'use strict';

  describe('cloud-foundry application model', function () {
    var $httpBackend, $timeout, modelManager, applicationModel;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      modelManager = $injector.get('app.model.modelManager');
      applicationModel = modelManager.retrieve('cloud-foundry.model.application');
      $timeout = $injector.get('$timeout');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('getAppSummary', function () {
      var GetAppSummary = mock.cloudFoundryAPI.Apps.GetAppSummary('123');

      expect(applicationModel.application.summary.state).toBe('LOADING');
      $httpBackend.whenGET(GetAppSummary.url).respond(200, GetAppSummary.response['200'].body);
      $httpBackend.expectGET(GetAppSummary.url);
      applicationModel.getAppSummary('guid', '123');
      $httpBackend.flush();
      expect(applicationModel.application.summary.state).toBe('STOPPED');
    });

    it('startApp', function () {
      var GetAppSummary = mock.cloudFoundryAPI.Apps.GetAppSummary('123');
      var UpdateApp = mock.cloudFoundryAPI.Apps.UpdateApp('123', {state: 'STARTED'});
      var GetDetailedStatsForStartedApp = mock.cloudFoundryAPI.Apps.GetDetailedStatsForStartedApp('123');

      $httpBackend.whenGET(GetAppSummary.url).respond(200, GetAppSummary.response['200'].body);
      $httpBackend.whenPUT(UpdateApp.url).respond(201, UpdateApp.response['201'].body);
      $httpBackend.whenGET(GetDetailedStatsForStartedApp.url).respond(200,
        GetDetailedStatsForStartedApp.response['200'].body);
      $httpBackend.expectGET(GetAppSummary.url);
      $httpBackend.expectPUT(UpdateApp.url);
      $httpBackend.expectGET(GetDetailedStatsForStartedApp.url);
      applicationModel.getAppSummary('guid', '123');
      applicationModel.startApp('guid', '123');
      $httpBackend.flush();
      expect(applicationModel.appStateSwitchTo).toBe('');
      expect(applicationModel.application.summary.state).toBe('STARTED');
    });

    it('stopApp', function () {
      var GetAppSummary = mock.cloudFoundryAPI.Apps.GetAppSummary('123');
      var UpdateApp = mock.cloudFoundryAPI.Apps.UpdateApp('123', {state: 'STOPPED'});

      $httpBackend.whenGET(GetAppSummary.url).respond(200, GetAppSummary.response['200'].body);
      $httpBackend.whenPUT(UpdateApp.url).respond(201, UpdateApp.response['201'].body);
      $httpBackend.expectGET(GetAppSummary.url);
      $httpBackend.expectPUT(UpdateApp.url);
      applicationModel.getAppSummary('guid', '123');
      applicationModel.stopApp('guid', '123');
      $httpBackend.flush();
      expect(applicationModel.appStateSwitchTo).toBe('');
      expect(applicationModel.application.summary.state).toBe('STOPPED');
    });

    it('restartApp', function () {
      var GetAppSummary = mock.cloudFoundryAPI.Apps.GetAppSummary('123');
      var UpdateApp = mock.cloudFoundryAPI.Apps.UpdateApp('123', {state: 'STARTED'});
      var GetDetailedStatsForStartedApp = mock.cloudFoundryAPI.Apps.GetDetailedStatsForStartedApp('123');

      $httpBackend.whenGET(GetAppSummary.url).respond(200, GetAppSummary.response['200'].body);
      $httpBackend.whenGET(GetDetailedStatsForStartedApp.url).respond(200,
        GetDetailedStatsForStartedApp.response['200'].body);
      $httpBackend.whenPUT(UpdateApp.url).respond(201, UpdateApp.response['201'].body);
      $httpBackend.expectGET(GetAppSummary.url);
      $httpBackend.expectPUT(UpdateApp.url);
      $httpBackend.expectGET(GetDetailedStatsForStartedApp.url);
      applicationModel.getAppSummary('guid', '123');
      applicationModel.restartApp('guid', '123');
      $httpBackend.flush();
      expect(applicationModel.appStateSwitchTo).toBe('');
      expect(applicationModel.application.summary.state).toBe('STARTED');
    });

    it('createApp', function () {
      var newAppSpec = Object();
      newAppSpec.name = 'myTestApp';
      newAppSpec.space_guid = 'guid-e5ae5698-5796-43c9-ab1a-2cd21306b638';
      var guid = '67eff332-a6e9-4b74-8ee3-608a6fd152b7';
      var CreateApp = mock.cloudFoundryAPI.Apps.CreateApp(newAppSpec);
      var GetAppSummary = mock.cloudFoundryAPI.Apps.GetAppSummary(guid);
      $httpBackend.whenGET(GetAppSummary.url).respond(200, GetAppSummary.response['200'].body);
      $httpBackend.whenPOST(CreateApp.url).respond(201, CreateApp.response['201'].body);
      $httpBackend.whenGET('/pp/v1/proxy/v2/apps?results-per-page=48').respond(200, {guid: {}});
      $httpBackend.expectPOST(CreateApp.url);
      $httpBackend.expectGET(GetAppSummary.url);
      applicationModel.createApp('guid', newAppSpec);
      applicationModel.getAppSummary('guid', guid);
      $httpBackend.flush();
      expect(CreateApp.response['201'].body.entity.name).toBe(newAppSpec.name);
    });

    it('updateApp', function () {
      var newAppSpec = Object();
      newAppSpec.name = 'myUpdatedTestApp';
      var guid = '84a911b3-16f7-4f47-afa4-581c86018600';
      var GetAppSummary = mock.cloudFoundryAPI.Apps.GetAppSummary(guid);
      var UpdateApp = mock.cloudFoundryAPI.Apps.UpdateApp(guid, newAppSpec);
      $httpBackend.whenGET(GetAppSummary.url).respond(200, GetAppSummary.response['200'].body);
      $httpBackend.whenPUT(UpdateApp.url).respond(201, UpdateApp.response['201'].body);
      $httpBackend.expectPUT(UpdateApp.url);
      $httpBackend.expectGET(GetAppSummary.url);
      applicationModel.update('guid', guid, newAppSpec);
      applicationModel.getAppSummary('guid', guid);
      $httpBackend.flush();
      expect(UpdateApp.response['201'].body.entity.name).toBe(newAppSpec.name);
      expect(UpdateApp.response['201'].body.metadata.guid).toBe(guid);
    });

    it('deleteApp', function () {
      var DeleteApp = mock.cloudFoundryAPI.Apps.DeleteApp(123);
      $httpBackend.whenDELETE(DeleteApp.url).respond(204, DeleteApp.response['204'].body);
      $httpBackend.expectDELETE(DeleteApp.url);
      applicationModel.deleteApp('guid', 123);
      $httpBackend.flush();
      expect(DeleteApp.response['204'].body).toBeDefined();
    });

    it('getAppStats', function () {
      var guid = '84a911b3-16f7-4f47-afa4-581c86018600';
      var params = {};
      var GetDetailedStatsForStartedApp = mock.cloudFoundryAPI.Apps.GetDetailedStatsForStartedApp(guid);
      $httpBackend.whenGET(GetDetailedStatsForStartedApp.url)
        .respond(200, GetDetailedStatsForStartedApp.response['200'].body);
      $httpBackend.expectGET(GetDetailedStatsForStartedApp.url);
      applicationModel.getAppStats('guid', guid, params);
      $httpBackend.flush();
      expect(GetDetailedStatsForStartedApp.response['200'].body['0'].state).toBe('RUNNING');
    });

    describe('listAllApps', function () {

      var userServiceInstancesModel;

      var cnsiGuid1 = 'cnsiGuid1';
      var cnsiGuid2 = 'cnsiGuid2';
      var serviceInstances = _.set({}, cnsiGuid1, {
        guid: cnsiGuid1,
        name: 'hcf',
        cnsi_type: 'hcf',
        valid: true,
        error: false
      });
      _.set(serviceInstances, cnsiGuid2, {
        guid: cnsiGuid2,
        name: 'hcf',
        cnsi_type: 'hcf',
        valid: true,
        error: false
      });

      beforeEach(function () {
        userServiceInstancesModel = modelManager.retrieve('app.model.serviceInstance.user');
      });

      function createResponse(resultsPerPage, results, pages) {
        var appsInResponse = resultsPerPage <= results ? resultsPerPage : results;
        var apps = [];
        for (var i = 0; i < appsInResponse; i++) {
          apps.push({

          });
        }
        return {
          total_results: results,
          total_pages: pages,
          resources: apps
        };
      }

      it('no connected cnsi', function () {
        applicationModel._listAllApps().then(function () {
          expect(applicationModel.hasApps).toBe(false);
          expect(applicationModel.filteredApplications.length).toBe(0);
          expect(applicationModel.bufferedApplications.length).toBe(0);
          expect(applicationModel.unfilteredApplicationCount).toBe(0);
        });
      });

      it('one connected cnsi and no filters', function () {
        userServiceInstancesModel.serviceInstances = _.set({}, cnsiGuid1, _.cloneDeep(serviceInstances.cnsiGuid1));

        var cnsi1AppCount = 3;
        // One cnsi in response
        var response = _.set({}, cnsiGuid1, createResponse(100, cnsi1AppCount, 1));
        $httpBackend.expectGET('/pp/v1/proxy/v2/apps?page=1&results-per-page=100').respond(200, response);

        applicationModel._listAllApps().then(function () {
          expect(applicationModel.hasApps).toBe(true);
          expect(applicationModel.filteredApplications.length).toBe(cnsi1AppCount);
          expect(applicationModel.bufferedApplications.length).toBe(cnsi1AppCount);
          expect(applicationModel.unfilteredApplicationCount).toBe(cnsi1AppCount);
        });

        $httpBackend.flush();
      });

      it('two connected cnsi and no filters', function () {
        userServiceInstancesModel.serviceInstances = _.cloneDeep(serviceInstances);

        var cnsi1AppCount = 3;
        var cnsi2AppCount = 4;
        // Two cnsi in response
        var response = _.set({}, cnsiGuid1, createResponse(100, cnsi1AppCount, 1));
        _.set(response, cnsiGuid2, createResponse(100, cnsi2AppCount, 1));
        $httpBackend.expectGET('/pp/v1/proxy/v2/apps?page=1&results-per-page=100').respond(200, response);

        applicationModel._listAllApps().then(function () {
          expect(applicationModel.hasApps).toBe(true);
          expect(applicationModel.filteredApplications.length).toBe(cnsi1AppCount + cnsi2AppCount);
          expect(applicationModel.bufferedApplications.length).toBe(cnsi1AppCount + cnsi2AppCount);
          expect(applicationModel.unfilteredApplicationCount).toBe(cnsi1AppCount + cnsi2AppCount);
        });

        $httpBackend.flush();
      });

      it('one connected cnsi and cnsi filter (no results)', function () {
        userServiceInstancesModel.serviceInstances = _.set({}, cnsiGuid1, _.cloneDeep(serviceInstances.cnsiGuid1));

        var cnsi1AppCount = 6;
        // One cnsi in response
        var response = _.set({}, cnsiGuid1, createResponse(100, cnsi1AppCount, 1));
        $httpBackend.expectGET('/pp/v1/proxy/v2/apps?page=1&results-per-page=100').respond(200, response);

        // filter by a cnsi not in the response
        applicationModel.filterParams.cnsiGuid = cnsiGuid2;
        applicationModel._listAllApps().then(function () {
          expect(applicationModel.hasApps).toBe(false);
          expect(applicationModel.filteredApplications.length).toBe(0);
          expect(applicationModel.bufferedApplications.length).toBe(cnsi1AppCount);
          expect(applicationModel.unfilteredApplicationCount).toBe(cnsi1AppCount);
        });

        $httpBackend.flush();
      });

      it('two connected cnsi and cnsi filter', function () {
        userServiceInstancesModel.serviceInstances = _.set({}, cnsiGuid1, _.cloneDeep(serviceInstances.cnsiGuid1));

        var cnsi1AppCount = 8;
        var cnsi2AppCount = 2;
        // Two cnsi in response
        var response = _.set({}, cnsiGuid1, createResponse(100, cnsi1AppCount, 1));
        _.set(response, cnsiGuid2, createResponse(100, cnsi2AppCount, 1));
        $httpBackend.expectGET('/pp/v1/proxy/v2/apps?page=1&results-per-page=100').respond(200, response);

        // filter by a cnsi in the response
        applicationModel.filterParams.cnsiGuid = cnsiGuid2;
        applicationModel._listAllApps().then(function () {
          expect(applicationModel.hasApps).toBe(true);
          expect(applicationModel.filteredApplications.length).toBe(cnsi2AppCount);
          expect(applicationModel.bufferedApplications.length).toBe(cnsi1AppCount + cnsi2AppCount);
          expect(applicationModel.unfilteredApplicationCount).toBe(cnsi1AppCount + cnsi2AppCount);
        });

        $httpBackend.flush();
      });

      it('one connected cnsi and org filter', function (done) {
        userServiceInstancesModel.serviceInstances = _.set({}, cnsiGuid1, _.cloneDeep(serviceInstances.cnsiGuid1));

        var orgGuid = 'orgGuid';
        var cnsi1AppCount = 10;
        var cnsi1AppCountFiltered = cnsi1AppCount - 2;

        // Expect one call to ListAllApps for the initial request. This contains an org filter
        var response1 = _.set({}, cnsiGuid1, createResponse(100, cnsi1AppCountFiltered, 1));
        $httpBackend.expectGET('/pp/v1/proxy/v2/apps?page=1&q=organization_guid:' + orgGuid + '&results-per-page=100').respond(200, response1);

        // Expect a second call to ListAllApps without a filter to determine the total apps
        var response2 = _.set({}, cnsiGuid1, createResponse(1, cnsi1AppCount, 1));
        $httpBackend.expectGET('/pp/v1/proxy/v2/apps?results-per-page=1').respond(200, response2);

        applicationModel.filterParams.cnsiGuid = cnsiGuid1;
        applicationModel.filterParams.orgGuid = orgGuid;

        applicationModel._listAllApps().then(function () {
          expect(applicationModel.hasApps).toBe(true);
          expect(applicationModel.filteredApplications.length).toBe(cnsi1AppCountFiltered);
          expect(applicationModel.bufferedApplications.length).toBe(cnsi1AppCountFiltered);
        });

        // The second request to ListAllApps is not part of the promise chain, so give it a cycle to complete
        $timeout(function () {
          expect(applicationModel.unfilteredApplicationCount).toBe(cnsi1AppCount);
          done();
        });

        $httpBackend.flush();
        $timeout.flush();
      });

      it('two connected cnsi and org filter', function (done) {
        userServiceInstancesModel.serviceInstances = _.set({}, cnsiGuid1, _.cloneDeep(serviceInstances.cnsiGuid1));

        var orgGuid = 'orgGuid';
        var cnsi1AppCount = 11;
        var cnsi1AppCountFiltered = cnsi1AppCount - 2;
        var cnsi2AppCount = 6;

        // Expect one call to ListAllApps for the initial request. This contains an org filter
        var response1 = _.set({}, cnsiGuid1, createResponse(100, cnsi1AppCountFiltered, 1));
        _.set(response1, cnsiGuid2, createResponse(100, 0, 1));
        $httpBackend.expectGET('/pp/v1/proxy/v2/apps?page=1&q=organization_guid:' + orgGuid + '&results-per-page=100').respond(200, response1);

        // Expect a second call to ListAllApps without a filter to determine the total apps
        var response2 = _.set({}, cnsiGuid1, createResponse(1, cnsi1AppCount, 1));
        _.set(response2, cnsiGuid2, createResponse(100, cnsi2AppCount, 1));
        $httpBackend.expectGET('/pp/v1/proxy/v2/apps?results-per-page=1').respond(200, response2);

        applicationModel.filterParams.cnsiGuid = cnsiGuid1;
        applicationModel.filterParams.orgGuid = orgGuid;

        applicationModel._listAllApps().then(function () {
          expect(applicationModel.hasApps).toBe(true);
          expect(applicationModel.filteredApplications.length).toBe(cnsi1AppCountFiltered);
          expect(applicationModel.bufferedApplications.length).toBe(cnsi1AppCountFiltered);
        });

        // The second request to ListAllApps is not part of the promise chain, so give it a cycle to complete
        $timeout(function () {
          expect(applicationModel.unfilteredApplicationCount).toBe(cnsi1AppCount + cnsi2AppCount);
          done();
        });

        $httpBackend.flush();
        $timeout.flush();
      });

    });
  });

})();
