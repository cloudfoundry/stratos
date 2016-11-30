/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  describe('endpoint dashboard tests', function () {
    var $httpBackend, $q, controller, modelManager, registerServiceCalled, registerServiceType, $scope;

    var validService = {
      api_endpoint: {
        Scheme: 'http',
        Host: 'api.foo.com'
      },
      cnsi_type: 'hcf',
      guid: '1',
      name: 'c1',
      token_expiry: Number.MAX_VALUE
    };
    var validServicesEndpoint = {
      key: 'cnsi_1',
      name: 'c1',
      connected: 'connected',
      type: 'Helion Cloud Foundry'
    };

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module({
      'app.utils.utilsService': {
        chainStateResolve: function (state, $state, init) {
          init();
        },
        getClusterEndpoint: function () {
          return '';
        },
        getProductStrings: function () {
          return {
            PRODUCT_VERSION: '4.0',
            TERMS_OF_USE_HREF: 'http://docs.hpcloud.com/permalink/helion-openstack/3.0/eula',
            PRIVACY_HREF: 'https://www.hpe.com/us/en/legal/privacy.html',
            PRODUCT_CONSOLE: 'Helion Stackato Web Console',
            CONSOLE: 'Console',
            PRODUCT_NAME: 'Helion Stackato',
            COMPANY_NAME: 'Hewlett Packard Enterprise Company, L.P.',
            TERMS_OF_USE: 'Terms of Use',
            PRIVACY: 'Privacy',
            CODE_ENGINE: 'Helion Code Engine',
            CLOUD_FOUNDRY: 'Helion Cloud Foundry'
          };
        }
      }
    }));
    beforeEach(module('app.view.endpoints.dashboard'));
    beforeEach(module(function ($provide) {
      var mock = function (config, context) {
        registerServiceCalled = true;
        expect(context.data.type).toBe(registerServiceType);
        return {rendered: $q.resolve(), result: $q.reject()};
      };
      $provide.value('helion.framework.widgets.detailView', mock);
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

      modelManager = $injector.get('app.model.modelManager');
      var registerService = $injector.get('app.view.registerService');
      var utils = $injector.get('app.utils.utilsService');
      var serviceInstanceService = $injector.get('app.view.endpoints.dashboard.serviceInstanceService');

      // Patch user account model
      var userModel = modelManager.retrieve('app.model.account');
      userModel.accountData = {
        isAdmin: isAdmin
      };

      var items = [validService];

      modelManager.register('app.model.account', userModel);

      var EndpointsDashboardController = $state.get('endpoint.dashboard').controller;
      controller = new EndpointsDashboardController($q, $scope, $state, modelManager, utils, registerService, serviceInstanceService);

      $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, items);
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, items);
      $httpBackend.whenGET('/pp/v1/proxy/v2/info').respond(200, {});
      $httpBackend.whenGET('/pp/v1/proxy/info').respond(200, {});
      $httpBackend.whenGET('/pp/v1/stackato/info').respond(200, {});
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

      it('should show cluster registration detail view when showClusterAddForm is invoked for hce', function () {
        registerServiceType = 'hce';
        controller.register(registerServiceType);
        $scope.$digest();
        expect(registerServiceCalled).toBe(true);
        $httpBackend.flush();
      });

      it('should show cluster registration detail view when showClusterAddForm is invoked for hcf', function () {
        registerServiceType = 'hcf';
        controller.register();
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
      });

      it('initialisation fails', function () {
        $httpBackend.expect('GET', '/pp/v1/cnsis').respond(500, {});
        $httpBackend.flush();
        expect(controller.initialised).toBe(true);
        expect(controller.endpoints).toBeDefined();
        expect(controller.endpoints.length).toBe(0);
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

      afterEach(function () {
        $httpBackend.flush();
      });

      it('should say if user is an admin', function () {
        expect(controller.isUserAdmin()).toBe(true);
      });
    });
  });

})();
