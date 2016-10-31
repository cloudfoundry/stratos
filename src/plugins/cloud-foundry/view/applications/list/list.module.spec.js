(function () {
  'use strict';

  describe('list module', function () {

    var $controller, $httpBackend, $scope, eventService, $state;

    var cnsiGuid = 'cnsiGuid';
    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    function createController($injector, type) {
      $httpBackend = $injector.get('$httpBackend');

      var $interpolate = $injector.get('$interpolate');
      $state = $injector.get('$state');
      var $timeout = $injector.get('$timeout');
      var $q = $injector.get('$q');
      var modelManager = $injector.get('app.model.modelManager');
      eventService = $injector.get('app.event.eventService');
      var errorService = $injector.get('app.error.errorService');
      var utils = $injector.get('app.utils.utilsService');

      var userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
      userCnsiModel.serviceInstances = {
        cnsiGuid: {
          cnsi_type: 'hcf',
          guid: cnsiGuid
        }
      };

      var authModelOpts = {
        role: type ? type : 'admin',
        cnsiGuid: cnsiGuid
      };
      mock.cloudFoundryModel.Auth.initAuthModel($injector, authModelOpts);

      $scope = $injector.get('$rootScope').$new();

      var ApplicationsListController = $state.get('cf.applications.list').controller;
      $controller = new ApplicationsListController($scope, $interpolate, $state, $timeout, $q, modelManager, eventService, errorService, utils);
      expect($controller).toBeDefined();
    }

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('`no app message` tests', function () {

      beforeEach(inject(function ($injector) {
        createController($injector);
      }));

      it('should return correct message when no filters have been set', function () {
        expect($controller.getNoAppsMessage()).toBe('You have no applications.');
      });

      it('should return the correct message when a cluster filter has been set', function () {
        // set cnsiGuid param
        $controller.model.filterParams.cnsiGuid = 'test';
        expect($controller.getNoAppsMessage()).toBe('This endpoint has no applications.');

      });

      it('should return the correct message when an org filter has been set', function () {
        $controller.model.filterParams.cnsiGuid = 'test';
        $controller.model.filterParams.orgGuid = 'test';
        expect($controller.getNoAppsMessage()).toBe('This organization has no applications.');
      });

      it('should return the correct message when a space filter has been set', function () {
        $controller.model.filterParams.cnsiGuid = 'test';
        $controller.model.filterParams.orgGuid = 'test';
        $controller.model.filterParams.spaceGuid = 'test';
        expect($controller.getNoAppsMessage()).toBe('This space has no applications.');
      });

    });

    describe('endpoints link tests', function () {

      beforeEach(inject(function ($injector) {
        createController($injector);
        spyOn($state, 'go').and.callFake(function (state) {
          return state;
        });
      }));

      it('should forward to `Endpoints Dashboard` when no clusters are available', function () {
        $controller.model.clusterCount = 0;
        var endpointsLink = $controller.getEndpointsLink();
        expect(endpointsLink).toBe('endpoint.dashboard');
      });

      it('should forward to `cluster view` when a singular cluster is connected', function () {
        $controller.userCnsiModel.serviceInstances = [{
          id: 'test',
          cnsi_type: 'hcf'
        }];
        $controller.model.clusterCount = 1;
        var endpointsLink = $controller.getEndpointsLink();
        expect(endpointsLink).toBe('endpoint.clusters.cluster.detail.organizations');
      });

      it('should take to `Clusters view` when clusters are available ', function () {
        $controller.model.clusterCount = 1;
        $controller.userCnsiModel.serviceInstances = [];
        var endpointsLink = $controller.getEndpointsLink();
        expect(endpointsLink).toBe('endpoint.clusters.tiles');
      });
    });

    describe('filter tests', function () {

      var orgGuid = 'orgGuid';
      beforeEach(inject(function ($injector) {

        createController($injector);

        var listAllOrgs = mock.cloudFoundryAPI.Organizations.ListAllOrganizations('default');
        $httpBackend.whenGET(listAllOrgs.url).respond(200, listAllOrgs.response[200].body);

        var listAllSpacesForOrg = mock.cloudFoundryAPI.Organizations.ListAllSpacesForOrganization(orgGuid);
        $httpBackend.whenGET(listAllSpacesForOrg.url).respond(200, listAllSpacesForOrg.response[200].body);
      }));

      it('should correctly set organisations when a cluster is selected', function () {

        $controller.filter.cnsiGuid = cnsiGuid;
        $controller.setCluster();
        $httpBackend.flush();
        expect($controller.organizations.length).toBe(2);
      });

      it('should correctly set spaces when an organisation is selected', function () {

        $controller.filter.orgGuid = orgGuid;
        $controller.model.filterParams.cnsiGuid = cnsiGuid;
        $controller.setOrganization();
        $httpBackend.flush();
        expect($controller.spaces.length).toBe(2);
      });

    });

    describe('auth model tests for admin', function () {

      beforeEach(inject(function ($injector) {
        createController($injector);
      }));

      it('should show `Add Application` button to user', function () {
        expect($controller.showAddApplicationButton()).toBe(true);
      });
    });

    describe('auth model tests for non-admin developer', function () {

      beforeEach(inject(function ($injector) {
        createController($injector, 'space_developer', true);

      }));

      it('should show `Add Application` button to user', function () {
        $controller.ready = true;
        expect($controller.showAddApplicationButton()).toBe(true);
      });
    });

    describe('auth model tests for non-admin non-developer', function () {

      beforeEach(inject(function ($injector) {
        createController($injector, 'space_manager', true);

      }));

      it('should hide `Add Application` button to user', function () {
        $controller.ready = true;
        expect($controller.showAddApplicationButton()).toBe(false);
      });
    });

  });

})();
