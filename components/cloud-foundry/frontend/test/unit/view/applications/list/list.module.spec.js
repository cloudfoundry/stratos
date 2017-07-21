(function () {
  'use strict';

  describe('list module', function () {

    var $controller, $httpBackend, $scope, $state, appWallActionContext;

    var cnsiGuid = 'cnsiGuid';
    // Matches org from ListAllOrganizations
    var orgGuid = 'dbc9862e-6e71-4bb8-a768-8d6597b5bd89';
    // Matches space from ListAllSpacesForOrganization
    var spaceGuid = '0063f106-074b-415a-94ee-5cf3afd7db5c';

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    function createController($injector, type) {
      $httpBackend = $injector.get('$httpBackend');

      var $translate = $injector.get('$translate');
      $state = $injector.get('$state');
      var $timeout = $injector.get('$timeout');
      var $q = $injector.get('$q');
      var modelManager = $injector.get('modelManager');
      var errorService = $injector.get('appErrorService');
      var appUtilsService = $injector.get('appUtilsService');
      var cfOrganizationModel = $injector.get('cfOrganizationModel');
      var cfAppWallActions = $injector.get('cfAppWallActions');
      var $window = $injector.get('$window');

      var userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
      if (Object.keys(userCnsiModel.serviceInstances).length === 0) {
        userCnsiModel.serviceInstances = {
          cnsiGuid: {
            cnsi_type: 'cf',
            guid: cnsiGuid,
            valid: true,
            error: false
          }
        };
      }

      var authModelOpts = {
        role: type ? type : 'admin',
        cnsiGuid: cnsiGuid,
        orgGuid: orgGuid,
        spaceGuid: spaceGuid
      };
      mock.cloudFoundryModel.Auth.initAuthModel($injector, authModelOpts);

      $scope = $injector.get('$rootScope').$new();

      var ApplicationsListController = $state.get('cf.applications.list').controller;
      $controller = new ApplicationsListController($scope, $translate, $state, $timeout, $q, $window, modelManager,
        errorService, appUtilsService, cfOrganizationModel, cfAppWallActions);
      expect($controller).toBeDefined();

      var listAllOrgs = mock.cloudFoundryAPI.Organizations.ListAllOrganizations('default');
      $httpBackend.whenGET(listAllOrgs.url).respond(200, listAllOrgs.response[200].body);

      var listAllSpacesForOrg = mock.cloudFoundryAPI.Organizations.ListAllSpacesForOrganization(orgGuid);
      $httpBackend.whenGET(listAllSpacesForOrg.url).respond(200, listAllSpacesForOrg.response[200].body);

      var ListAllApps = mock.cloudFoundryAPI.Apps.ListAllApps(cnsiGuid, 1, spaceGuid);
      $httpBackend.whenGET(ListAllApps.url).respond(200, ListAllApps.response[200].body);

      var ListAllAppsOneResult = mock.cloudFoundryAPI.Apps.ListAllAppsOneResult(cnsiGuid);
      $httpBackend.whenGET(ListAllAppsOneResult.url).respond(200, ListAllAppsOneResult.response[200].body);

      _.forEach(ListAllApps.response[200].body[cnsiGuid].resources, function (app) {
        var GetDetailedStatsForStartedApp = mock.cloudFoundryAPI.Apps.GetDetailedStatsForStartedApp(app.metadata.guid);
        $httpBackend.whenGET(GetDetailedStatsForStartedApp.url).respond(200, GetDetailedStatsForStartedApp.response[200].body);
      });

      appWallActionContext = $controller.appWallActions[0].context;
    }

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('`no app message` tests', function () {

      beforeEach(inject(function ($injector) {
        createController($injector);
      }));

      afterEach(function () {
        $httpBackend.flush();
      });

      it('should return correct message when no filters have been set', function () {
        expect($controller.getNoAppsMessage()).toBe('You have no applications');
      });

      it('should return the correct message when a cluster filter has been set', function () {
        // set cnsiGuid param
        $controller.model.filterParams.cnsiGuid = 'test';
        expect($controller.getNoAppsMessage()).toBe('This endpoint has no applications');

      });

      it('should return the correct message when an org filter has been set', function () {
        $controller.model.filterParams.cnsiGuid = 'test';
        $controller.model.filterParams.orgGuid = orgGuid;
        expect($controller.getNoAppsMessage()).toBe('This organization has no applications');
      });

      it('should return the correct message when a space filter has been set', function () {
        var ListAllApps = mock.cloudFoundryAPI.Apps.ListAllApps(cnsiGuid, 1, 'test');
        $httpBackend.whenGET(ListAllApps.url).respond(200, ListAllApps.response[200].body);

        $controller.model.filterParams.cnsiGuid = 'test';
        $controller.model.filterParams.orgGuid = orgGuid;
        $controller.model.filterParams.spaceGuid = 'test';
        expect($controller.getNoAppsMessage()).toBe('This space has no applications');
      });

    });

    describe('endpoints link tests', function () {

      var redirectStateName;

      beforeEach(inject(function ($injector) {

        // For some tests, the redirected state depends on whether the endpoints dashboard is available
        redirectStateName = $state.get('endpoint.dashboard') ? 'endpoint.dashboard' : 'endpoint.clusters.cluster.detail.organizations';

        createController($injector);
        spyOn($state, 'go').and.callFake(function (state) {
          return state;
        });
      }));

      it('should forward to `Endpoints Dashboard` when no clusters are available', function () {
        $controller.model.clusterCount = 0;
        var endpointsLink = $controller.getEndpointsLink();
        expect(endpointsLink).toBe(redirectStateName);
        $httpBackend.flush();
      });

      it('should forward to `cluster view` when a singular cluster is connected', function () {
        $controller.userCnsiModel.serviceInstances = [{
          id: 'test',
          cnsi_type: 'cf'
        }];
        $controller.model.clusterCount = 1;
        var endpointsLink = $controller.getEndpointsLink();
        expect(endpointsLink).toBe('endpoint.clusters.cluster.detail.organizations');
        $httpBackend.flush();
      });

      it('should take to `Clusters view` when clusters are available ', function () {
        $controller.model.clusterCount = 1;
        $controller.userCnsiModel.serviceInstances = [];
        var endpointsLink = $controller.getEndpointsLink();
        expect(endpointsLink).toBe('endpoint.clusters.tiles');
      });
    });

    describe('filter tests', function () {

      var $q, modelManager, userCnsiModel, orgModel, injector;

      var allFilterValue = 'all';

      function createOrgOrSpace(guid) {
        return {
          metadata: {
            guid: guid
          },
          entity: {}
        };
      }

      beforeEach(inject(function ($injector) {
        injector = $injector;

        $q = $injector.get('$q');
        modelManager = $injector.get('modelManager');
        userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');

        orgModel = $injector.get('cfOrganizationModel');
      }));

      describe('Single cluster/org/space', function () {

        beforeEach(function () {
          userCnsiModel.serviceInstances = {
            cnsiGuid1: {
              cnsi_type: 'cf',
              guid: cnsiGuid
            }
          };
          spyOn(orgModel, 'listAllOrganizations').and.returnValue($q.resolve([ createOrgOrSpace(orgGuid) ]));
          spyOn(orgModel, 'listAllSpacesForOrganization').and.returnValue($q.resolve([ createOrgOrSpace(spaceGuid) ]));

          createController(injector);

          $httpBackend.flush();
        });

        it('should automatically select', function () {
          expect($controller.model.filterParams.cnsiGuid).toBe(cnsiGuid);
          expect($controller.filter.cnsiGuid).toBe(cnsiGuid);

          expect($controller.model.filterParams.orgGuid).toBe(orgGuid);
          expect($controller.filter.orgGuid).toBe(orgGuid);

          expect($controller.model.filterParams.spaceGuid).toBe(spaceGuid);
          expect($controller.filter.spaceGuid).toBe(spaceGuid);
        });
      });

      describe('Multiple clusters/orgs/spaces', function () {

        beforeEach(function () {
          userCnsiModel.serviceInstances = {
            cnsiGuid1: {
              cnsi_type: 'cf',
              guid: 'cnsiGuid1'
            },
            cnsiGuid2: {
              cnsi_type: 'cf',
              guid: 'cnsiGuid2'
            }
          };
          spyOn(orgModel, 'listAllOrganizations').and.returnValue($q.resolve([
            createOrgOrSpace(orgGuid),
            createOrgOrSpace('orgGuid2')
          ]));
          spyOn(orgModel, 'listAllSpacesForOrganization').and.returnValue($q.resolve([
            createOrgOrSpace(spaceGuid),
            createOrgOrSpace('spaceGuid2')
          ]));

          createController(injector);

          $scope.$digest();

          expect($controller.model.filterParams.cnsiGuid).toBe(allFilterValue);
          expect($controller.filter.cnsiGuid).toBe(allFilterValue);

          expect($controller.model.filterParams.orgGuid).toBe(allFilterValue);
          expect($controller.filter.orgGuid).toBe(allFilterValue);
          // The count will be orgs + 1 (for the 'all' options)
          expect($controller.organizations.length).toBe(1);

          expect($controller.model.filterParams.spaceGuid).toBe(allFilterValue);
          expect($controller.filter.spaceGuid).toBe(allFilterValue);
          // The count will be spaces + 1 (for the 'all' options)
          expect($controller.spaces.length).toBe(1);
        });

        it('should correctly set organisations when a cluster is selected', function () {
          $controller.filter.cnsiGuid = cnsiGuid;
          $controller.setCluster();

          $scope.$digest();

          expect($controller.model.filterParams.cnsiGuid).toBe(cnsiGuid);
          expect($controller.filter.cnsiGuid).toBe(cnsiGuid);

          expect($controller.model.filterParams.orgGuid).toBe(allFilterValue);
          expect($controller.filter.orgGuid).toBe(allFilterValue);
          // The count will be orgs + 1 (for the 'all' options)
          expect($controller.organizations.length).toBe(3);

          expect($controller.model.filterParams.spaceGuid).toBe(allFilterValue);
          expect($controller.filter.spaceGuid).toBe(allFilterValue);
          // The count will be spaces + 1 (for the 'all' options)
          expect($controller.spaces.length).toBe(1);
        });

        it('should correctly set spaces when an organisation is selected', function () {
          $controller.filter.cnsiGuid = cnsiGuid;
          $controller.setCluster();

          $controller.filter.orgGuid = orgGuid;
          $controller.setOrganization();

          $httpBackend.flush();

          expect($controller.model.filterParams.cnsiGuid).toBe(cnsiGuid);
          expect($controller.filter.cnsiGuid).toBe(cnsiGuid);

          expect($controller.model.filterParams.orgGuid).toBe(orgGuid);
          expect($controller.filter.orgGuid).toBe(orgGuid);
          // The count will be orgs + 1 (for the 'all' options)
          expect($controller.organizations.length).toBe(3);

          expect($controller.model.filterParams.spaceGuid).toBe(allFilterValue);
          expect($controller.filter.spaceGuid).toBe(allFilterValue);
          // The count will be spaces + 1 (for the 'all' options)
          expect($controller.spaces.length).toBe(3);
        });

        it('should correctly select spaces', function () {
          $controller.filter.cnsiGuid = cnsiGuid;
          $controller.setCluster();

          $controller.filter.orgGuid = orgGuid;
          $controller.setOrganization();

          $controller.filter.spaceGuid = spaceGuid;
          $controller.setSpace();

          $httpBackend.flush();

          expect($controller.model.filterParams.cnsiGuid).toBe(cnsiGuid);
          expect($controller.filter.cnsiGuid).toBe(cnsiGuid);

          expect($controller.model.filterParams.orgGuid).toBe(orgGuid);
          expect($controller.filter.orgGuid).toBe(orgGuid);
          // The count will be orgs + 1 (for the 'all' options)
          expect($controller.organizations.length).toBe(3);

          expect($controller.model.filterParams.spaceGuid).toBe(spaceGuid);
          expect($controller.filter.spaceGuid).toBe(spaceGuid);
          // The count will be spaces + 1 (for the 'all' options)
          expect($controller.spaces.length).toBe(3);
        });

      });

      describe('Application name filter', function () {
        beforeEach(function () {
          createController(injector);

          $httpBackend.flush();
        });

        it('apps matching filter', function () {

          var filterAppCount = $controller.model.filteredApplications.length;
          var unfilteredApplicationCount = $controller.model.unfilteredApplicationCount;

          var appNameSearchTerm = 'rc-test';
          $controller.filter.text = appNameSearchTerm;
          $controller.setText();

          $httpBackend.flush();

          expect($controller.model.filterParams.text).toBe(appNameSearchTerm);
          expect($controller.filter.text).toBe(appNameSearchTerm);

          expect($controller.model.filteredApplications.length).toBeLessThan(filterAppCount);
          expect($controller.model.unfilteredApplicationCount).toBe(unfilteredApplicationCount);
        });

        it('no apps matching filter', function () {
          var unfilteredApplicationCount = $controller.model.unfilteredApplicationCount;

          var appNameSearchTerm = 'therearenoappswiththisname';
          $controller.filter.text = appNameSearchTerm;
          $controller.setText();

          $httpBackend.flush();

          expect($controller.model.filterParams.text).toBe(appNameSearchTerm);
          expect($controller.filter.text).toBe(appNameSearchTerm);

          expect($controller.model.filteredApplications.length).toBe(0);
          expect($controller.model.unfilteredApplicationCount).toBe(unfilteredApplicationCount);

          expect($controller.getNoAppsMessage()).toBe('This space has no applications matching the search term');
        });
      });

      describe('Repopulate filters with previously selected cluster/org/space', function () {
        var filteredCnsiGuid = 'cnsiGuid2';
        var filteredOrgGuid = 'orgGuid2';
        var filteredSpaceGuid = 'spaceGuid2';

        function setUp() {

          // Return multiple entries
          userCnsiModel.serviceInstances = {
            cnsiGuid1: {
              cnsi_type: 'cf',
              guid: cnsiGuid
            },
            cnsiGuid2: {
              cnsi_type: 'cf',
              guid: filteredCnsiGuid
            }
          };
          spyOn(orgModel, 'listAllOrganizations').and.returnValue($q.resolve([
            createOrgOrSpace(orgGuid),
            createOrgOrSpace(filteredOrgGuid)
          ]));
          spyOn(orgModel, 'listAllSpacesForOrganization').and.returnValue($q.resolve([
            createOrgOrSpace(spaceGuid),
            createOrgOrSpace(filteredSpaceGuid)
          ]));

          createController(injector);
        }

        function check(expectedCnsiGuid, cnsiCount, expectedOrgGuid, orgCount, expectedSpaceGuid, spaceCount) {
          if (expectedCnsiGuid) {
            expect($controller.filter.cnsiGuid).toBe(expectedCnsiGuid);
            // The count will be clusters + 1 (for the 'all' options)
            expect($controller.clusters.length).toBe(cnsiCount);
          }

          if (expectedOrgGuid) {
            expect($controller.filter.orgGuid).toBe(expectedOrgGuid);
            // The count will be orgs + 1 (for the 'all' options)
            expect($controller.organizations.length).toBe(orgCount);
          }

          if (expectedSpaceGuid) {
            expect($controller.filter.spaceGuid).toBe(expectedSpaceGuid);
            // The count will be spaces + 1 (for the 'all' options)
            expect($controller.spaces.length).toBe(spaceCount);
          }
        }

        it('successfully sets all', function () {
          var appModel = modelManager.retrieve('cloud-foundry.model.application');
          appModel.filterParams.cnsiGuid = filteredCnsiGuid;
          appModel.filterParams.orgGuid = filteredOrgGuid;
          appModel.filterParams.spaceGuid = filteredSpaceGuid;

          setUp();
          $httpBackend.flush();

          check(filteredCnsiGuid, 3, filteredOrgGuid, 3, filteredSpaceGuid, 3);
        });

        it('avoids bad values - all', function () {
          var appModel = modelManager.retrieve('cloud-foundry.model.application');
          appModel.filterParams.cnsiGuid = 'junk1';
          appModel.filterParams.orgGuid = 'junk2';
          appModel.filterParams.spaceGuid = 'junk3';

          setUp();
          $httpBackend.flush();

          check(allFilterValue, 3, allFilterValue, 1, allFilterValue, 1);
        });

        it('avoids bad value - cluster', function () {
          var appModel = modelManager.retrieve('cloud-foundry.model.application');
          appModel.filterParams.cnsiGuid = 'junk1';

          setUp();
          $scope.$digest();

          check(allFilterValue, 3, allFilterValue, 1, allFilterValue, 1);
        });

        it('avoids bad value - org', function () {
          var appModel = modelManager.retrieve('cloud-foundry.model.application');
          appModel.filterParams.cnsiGuid = cnsiGuid;
          appModel.filterParams.orgGuid = 'junk2';

          setUp();
          $scope.$digest();

          check(cnsiGuid, 3, allFilterValue, 3, allFilterValue, 1);
        });

        it('avoids bad value - space', function () {
          var appModel = modelManager.retrieve('cloud-foundry.model.application');
          appModel.filterParams.cnsiGuid = cnsiGuid;
          appModel.filterParams.orgGuid = orgGuid;
          appModel.filterParams.spaceGuid = 'junk3';

          setUp();
          $httpBackend.flush();

          check(cnsiGuid, 3, orgGuid, 3, allFilterValue, 3);
        });

      });

    });

    describe('auth model tests for admin', function () {

      beforeEach(inject(function ($injector) {
        createController($injector);
      }));

      afterEach(function () {
        $httpBackend.flush();
      });

      it('should show `Add Application` button to user', function () {
        expect(appWallActionContext.hidden()).toBe(false);
      });
    });

    describe('auth model tests for non-admin developer', function () {

      beforeEach(inject(function ($injector) {
        createController($injector, 'space_developer', true);
      }));

      it('should show `Add Application` button to user', function () {
        $controller.ready = true;
        $httpBackend.flush();
        expect(appWallActionContext.hidden()).toBe(false);
      });
    });

    describe('auth model tests for non-admin non-developer', function () {

      beforeEach(inject(function ($injector) {
        createController($injector, 'space_manager', true);
      }));

      it('should hide `Add Application` button to user', function () {
        $controller.ready = true;
        $httpBackend.flush();
        expect(appWallActionContext.hidden()).toBe(true);
      });
    });

  });

})();
