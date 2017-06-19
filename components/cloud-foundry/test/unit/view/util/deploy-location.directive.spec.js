(function () {
  'use strict';

  /* eslint-disable angular/no-private-call */
  fdescribe('deploy location directive', function () {
    var $httpBackend, $scope, that, $q, appModel, authModel, cfOrganizationModel;

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    var values = {
      serviceInstances: []
    };

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      var modelManager = $injector.get('modelManager');
      appModel = modelManager.retrieve('cloud-foundry.model.application');
      authModel = modelManager.retrieve('cloud-foundry.model.auth');
      $q = $injector.get('$q');
      cfOrganizationModel = $injector.get('cfOrganizationModel');

      $scope.values = values;

      var markup = '<deploy-location service-instances="values.serviceInstances" service-instance="values.serviceInstance" organization="values.organization" space="values.space"></deploy-location>';

      var element = angular.element(markup);
      $compile(element)($scope);
      $scope.$apply();
      that = element.controller('deployLocation');
    }));

    function stopWatch() {
      that.stopWatchServiceInstance();
      that.stopWatchOrganization();
    }

    function simulateUserInput() {
      that.serviceInstance = { guid: 'cnsiGuid_123', api_endpoint: { Scheme: 'https' } };
      // that.organization = { };
      that.space = { metadata: { guid: 'space_guid' } };
    }

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be compilable', function () {
      expect(that).toBeDefined();
    });

    describe('- after init', function () {

      it('should watch userInput.serviceInstance', function () {
        spyOn(cfOrganizationModel, 'listAllOrganizations').and.returnValue($q.resolve());
        that.serviceInstance = {};
        $scope.$apply();
        expect(cfOrganizationModel.listAllOrganizations).toHaveBeenCalled();
      });

      it('should watch userInput.organization', function () {

        authModel.principal.guid = {
          userSummary: {
            spaces: {
              all: []
            }
          }
        };

        spyOn(cfOrganizationModel, 'listAllOrganizations').and.returnValue($q.resolve([]));
        spyOn(cfOrganizationModel, 'listAllSpacesForOrganization').and.returnValue($q.resolve([]));
        that.serviceInstance = {
          guid: 'guid'
        };
        $scope.$apply();
        that.organization = {
          metadata: {
            guid: 'organization-guid'
          }
        };
        $scope.$apply();
        expect(cfOrganizationModel.listAllOrganizations).toHaveBeenCalled();
        expect(that.space).toBe(null);
        expect(cfOrganizationModel.listAllSpacesForOrganization).toHaveBeenCalledWith('guid', 'organization-guid');

      });

    });

    fdescribe('#getOrganizations', function () {
      var organizations;

      beforeEach(function () {
        stopWatch();
        _.set(that, 'serviceInstance.guid', 'guid');
        // simulateUserInput();
        // $scope.$apply();
      });

      afterEach(function () {
        that.organization = null;
      });

      it('#getOrganizations - is admin', function () {
        organizations = mock.cloudFoundryAPI.Organizations.ListAllOrganizations(123).response['200'].body.resources;
        spyOn(cfOrganizationModel, 'listAllOrganizations').and.returnValue($q.resolve(organizations));
        authModel.isAdmin = function () { return true; };
        expect(that.organizations.length).toBe(0);
        var p = that.getOrganizations();
        $scope.$apply();
        expect(p.$$state.status).toBe(1);
        expect(that.organizations.length).toBe(1);
        expect(that.organizations[0].label).toBe(organizations[0].entity.name);
      });

      it('#getOrganizations - is not admin', function () {
        organizations = mock.cloudFoundryAPI.Organizations.ListAllOrganizations(123).response['200'].body.resources;
        spyOn(cfOrganizationModel, 'listAllOrganizations').and.returnValue($q.resolve(organizations));
        authModel.isAdmin = function () { return false; };
        authModel.principal = { cnsiGuid_123: { userSummary: { spaces: { all: [] } } } };
        expect(that.organizations.length).toBe(0);
        var p = that.getOrganizations();
        $scope.$apply();
        expect(p.$$state.status).toBe(1);
        expect(that.organizations.length).toBe(0);
      });

      it('#getOrganizations - no organizations', function () {
        // spyOn(cfOrganizationModel, 'listAllOrganizations').and.returnValue($q.resolve(organizations));
        // cfOrganizationModel.listAllOrganizations = function () {
        //   return $q.resolve([]); // empty array, no organizations
        // };
        // organizations = mock.cloudFoundryAPI.Organizations.ListAllOrganizations(123).response['200'].body.resources;
        spyOn(cfOrganizationModel, 'listAllOrganizations').and.returnValue($q.resolve([]));
        appModel.filterParams.orgGuid = 'not all';
        authModel.isAdmin = function () { return true; };
        expect(that.organizations.length).toBe(0);
        var p = that.getOrganizations();
        $scope.$apply();
        expect(p.$$state.status).toBe(1);
        expect(that.organizations.length).toBe(0);
        expect(that.userInput.organization).toBeUndefined();
      });
    });

    describe('#getSpacesForOrganization', function () {
      var spaces;

      beforeEach(function () {
        spaces = mock.cloudFoundryAPI.Organizations.ListAllSpacesForOrganization(123).response['200'].body.resources;
        cfOrganizationModel.listAllSpacesForOrganization = function () {
          return $q.resolve(spaces);
        };
        spyOn(cfOrganizationModel, 'listAllSpacesForOrganization').and.callThrough();
        stopWatch();
        simulateUserInput();
        that.space = null;
      });

      it('#getSpacesForOrganization - is admin', function () {
        authModel.isAdmin = function () { return true; };
        expect(that.spaces.length).toBe(0);
        var p = that.getSpacesForOrganization();
        $scope.$apply();
        expect(p.$$state.status).toBe(1);
        expect(that.spaces.length).toBe(1);
        expect(that.spaces[0].label).toBe(spaces[0].entity.name);
      });

      it('#getSpacesForOrganization - is not admin', function () {
        authModel.isAdmin = function () { return false; };
        authModel.principal = { cnsiGuid_123: { userSummary: { spaces: { all: [] } } } };
        expect(that.spaces.length).toBe(0);
        var p = that.getSpacesForOrganization();
        $scope.$apply();
        expect(p.$$state.status).toBe(1);
        expect(that.spaces.length).toBe(0);
      });

      it('#getSpacesForOrganization - no space', function () {
        cfOrganizationModel.listAllSpacesForOrganization = function () {
          return $q.resolve([]); // empty array, no spaces
        };
        appModel.filterParams.spaceGuid = 'not all';
        authModel.isAdmin = function () { return true; };
        expect(that.spaces.length).toBe(0);
        var p = that.getSpacesForOrganization();
        $scope.$apply();
        expect(p.$$state.status).toBe(1);
        expect(that.spaces.length).toBe(0);
        expect(that.space).toBeUndefined();
      });
    });
  });

  /* eslint-enable angular/no-private-call */
})();
