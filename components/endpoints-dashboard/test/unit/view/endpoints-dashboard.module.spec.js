/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  describe('endpoint dashboard tests', function () {
    var $httpBackend, $q, controller, modelManager, registerServiceCalled, $scope;

    var validService = {
      api_endpoint: {
        Scheme: 'http',
        Host: 'api.foo.com'
      },
      cnsi_type: 'cf',
      guid: '1',
      name: 'c1',
      token_expiry: Number.MAX_VALUE
    };
    var validServicesEndpoint = {
      key: 'cnsi_1',
      name: 'c1',
      type: 'cloud-foundry'
    };

    beforeEach(module('templates'));
    beforeEach(module('console-app'));
    beforeEach(module({
      appUtilsService: {
        chainStateResolve: function (state, $state, init) {
          init();
        },
        getClusterEndpoint: function () {
          return '';
        },
        isPluginAvailable: function () {
          return true;
        },
        replaceProperties: function (destination, source) {
          _.forIn(destination, function (value, key) {
            delete destination[key];
          });
          _.assign(destination, source);
        }
      }
    }));
    beforeEach(module('endpoints-dashboard'));
    beforeEach(module(function ($provide) {
      var mock = function () {
        // Params are config, context
        registerServiceCalled = true;
        return {rendered: $q.resolve(), result: $q.reject()};
      };
      $provide.value('frameworkDetailView', mock);
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    function createController($injector, isAdmin) {
      registerServiceCalled = false;
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      var $state = $injector.get('$state');
      $scope = $injector.get('$rootScope').$new();

      modelManager = $injector.get('modelManager');
      var appRegisterService = $injector.get('appRegisterService');
      var appUtilsService = $injector.get('appUtilsService');
      var appEndpointsDashboardService = $injector.get('appEndpointsDashboardService');

      // Patch user account model
      var userModel = modelManager.retrieve('app.model.account');
      var user = 'user';
      $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(200, {
        account: user,
        admin: isAdmin
      });
      userModel.login('user','');

      var items = [validService];

      modelManager.register('app.model.account', userModel);

      var EndpointsDashboardController = $state.get('endpoint.dashboard').controller;
      controller = new EndpointsDashboardController($scope, $state, modelManager, appUtilsService,
        appRegisterService, appEndpointsDashboardService);

      $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, items);
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, items);
      $httpBackend.when('GET', '/pp/v1/vcs/pat').respond(200, []);
      $httpBackend.when('GET', '/pp/v1/vcs/clients').respond(200, []);
      $httpBackend.whenGET('/pp/v1/proxy/v2/info').respond(200, {});
      $httpBackend.whenGET('/pp/v1/proxy/info').respond(200, {});
      $httpBackend.whenGET('/pp/v1/info').respond(200, {});
    }

    describe('controller tests', function () {

      beforeEach(inject(function ($injector) {
        createController($injector, true);
      }));

      it('should set showWelcomeMessage flag to false', function () {
        controller.showWelcomeMessage = true;
        expect(controller.showWelcomeMessage).toBeTruthy();
        controller.hideWelcomeMessage();
        expect(controller.showWelcomeMessage).toBeFalsy();
        $httpBackend.flush();
      });

      it('should show cluster registration detail view when showClusterAddForm is invoked', function () {
        controller.headerActions[0].execute();
        $scope.$digest();
        expect(registerServiceCalled).toBe(true);
        $httpBackend.flush();
      });

      it('should be uninitialised', function () {
        expect(controller.endpoints).toBeUndefined();
        expect(controller.initialised).toBe(false);
        $httpBackend.flush();
      });

      it('should be initialised', function () {
        $httpBackend.flush();
        expect(controller.initialised).toBe(true);
        expect(controller.endpoints).toBeDefined();
        expect(controller.endpoints.length).toBe(1);
        if (!_.some(controller.endpoints, validServicesEndpoint)) {
          fail('Could not find endpoint with values: ' + JSON.stringify(validServicesEndpoint));
        }
        expect(controller.endpoints[0].getStatus()).toEqual('connected');
      });

      it('initialisation fails', function () {
        $httpBackend.expect('GET', '/pp/v1/cnsis').respond(500, {});
        $httpBackend.flush();
        expect(controller.initialised).toBe(false);
        expect(controller.endpoints).toBeUndefined();
        expect(controller.listError).toBeTruthy();
      });
    });

    describe('non admin', function () {
      beforeEach(inject(function ($injector) {
        createController($injector, false);
      }));

      afterEach(function () {
        $httpBackend.flush();
      });

      it('should say if user is an admin', function () {
        expect(controller.isUserAdmin()).toBe(false);
      });
    });

    describe('admin', function () {
      beforeEach(inject(function ($injector) {
        createController($injector, true);
      }));

      it('should say if user is an admin', function () {
        $httpBackend.flush();
        expect(controller.isUserAdmin()).toBe(true);
      });
    });
  });

})();
