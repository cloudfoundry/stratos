(function () {
  'use strict';

  describe('endpoint dashboard tests', function () {
    var $httpBackend, $q, controller, modelManager;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module({
      'app.utils.utilsService': {
        chainStateResolve: function (state, $state, init) {
          init();
        }
      }
    }));
    beforeEach(module('app.view.endpoints.dashboard'));
    beforeEach(module(function ($provide) {
      var mock = function () {
        return {rendered: $q.resolve(), result: $q.reject()};
      };
      $provide.value('helion.framework.widgets.detailView', mock);
    }));

    function createController($injector, initializeServiceInstances) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      var $state = $injector.get('$state');
      var $scope = $injector.get('$rootScope').$new();

      modelManager = $injector.get('app.model.modelManager');
      var registerService = $injector.get('app.view.registerService');
      var utils = $injector.get('app.utils.utilsService');
      var serviceInstanceService = $injector.get('app.view.endpoints.dashboard.serviceInstanceService');

      // Patch user account model
      var userModel = modelManager.retrieve('app.model.account');
      userModel.accountData = {
        isAdmin: true
      };

      var items = [{
        guid: '1',
        name: 'c1',
        url: 'c1_url',
        api_endpoint: {
          Scheme: 'http',
          Host: 'api.foo.com'
        }
      }];

      modelManager.register('app.model.account', userModel);

      if (initializeServiceInstances) {
         // Initialise serviceInstance Model
        var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
        serviceInstanceModel.serviceInstances = items;
        modelManager.register('app.model.serviceInstance', serviceInstanceModel);
      }

      var EndpointsDashboardController = $state.get('endpoint.dashboard').controller;
      controller = new EndpointsDashboardController($q, $scope, $state, modelManager, utils, registerService, serviceInstanceService);

      $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, items);
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, items);
      $httpBackend.whenGET('/pp/v1/proxy/v2/info').respond(200, {});
    }

    describe('controller tests', function () {

      beforeEach(inject(function ($injector) {
        createController($injector, false);
      }));

      it('should say if user is an admin', function () {
        expect(controller.isUserAdmin()).toBe(true);
      });

      it('should set showWelcomeMessage flag to false', function () {
        controller.hideWelcomeMessage();
        expect(controller.showWelcomeMessage).toBe(false);
      });
    });

    describe('extended controller tests', function () {

      beforeEach(inject(function ($injector) {
        createController($injector, true);
      }));

    });
  });

})();
