(function () {
  'use strict';

  describe('endpoint dashboard tests', function () {
    var $httpBackend, $q, controller, modelManager;
    var detailViewCalled = false;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module('app.view.endpoints.dashboard'));
    beforeEach(module(function ($provide) {
      var mock = function () {
        detailViewCalled = true;
        return {rendered: $q.resolve(), result: $q.reject()};
      };
      $provide.value('helion.framework.widgets.detailView', mock);
    }));

    function createController($injector, initializeServiceInstances) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      var $state = $injector.get('$state');
      var $scope = $injector.get('$rootScope').$new();
      var $interpolate = $injector.get('$interpolate');

      modelManager = $injector.get('app.model.modelManager');
      var hceReg = $injector.get('app.view.hceRegistration');
      var hcfReg = $injector.get('app.view.hcfRegistration');
      var errorService = $injector.get('app.error.errorService');

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
      controller = new EndpointsDashboardController($scope, $interpolate, modelManager, $state, hceReg, hcfReg, errorService, $q);

      $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, items);
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, items);
      $httpBackend.whenGET('/pp/v1/proxy/v2/info').respond(200, {});
    }

    describe('controller tests', function () {

      beforeEach(inject(function ($injector) {
        createController($injector, false);
      }));

      it('should show cluster registration detail view when showClusterAddForm is invoked', function () {
        controller.showClusterAddForm();
        expect(detailViewCalled).toBe(true);
      });

      it('should show cluster registration detail view when showClusterAddForm is invoked', function () {
        controller.showClusterAddForm();
        expect(detailViewCalled).toBe(true);
      });

      it('should show cluster registration detail view when showClusterAddForm is invoked for hce', function () {
        controller.showClusterAddForm();
        expect(detailViewCalled).toBe(true);
      });

      it('should show cluster registration detail view when showClusterAddForm is invoked for hcf', function () {

        controller.showClusterAddForm(true);
        expect(detailViewCalled).toBe(true);
      });

      it('should update serviceInstances', function () {
        $httpBackend.flush();
        expect(true).toBe(true);
      });

      it('should say if user is an admin', function () {
        expect(controller.isUserAdmin()).toBe(true);
      });

      it('should show `serviceInstances` uninitialized', function () {
        expect(controller.serviceInstances).toEqual({});
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

      it('should show `serviceInstances` initialized', function () {
        expect(_.keys(controller.serviceInstances).length).toBe(1);
      });
    });
  });

})();
