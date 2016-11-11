(function () {
  'use strict';

  describe('endpoint view tests', function () {
    var $httpBackend, $q, controller,
      modelManager, userServiceInstanceModel, serviceInstanceModel, apiManager;
    var detailViewCalled = false;

    var items = [{
      guid: 1,
      name: 'c1',
      url: 'c1_url',
      cnsi_type: 'hce',
      api_endpoint: {
        Scheme: 'http',
        Host: 'api.foo.com'
      },
      model: {
        guid: '1',
        cnsi_type: 'hce',
        account: {},
        token_expiry: {},
        valid: true
      }
    }];

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module('app.view.endpoints.hce'));
    beforeEach(module(function ($provide) {
      var mock = function () {
        detailViewCalled = true;
        return {rendered: $q.resolve(), result: $q.reject()};
      };
      $provide.value('helion.framework.widgets.detailView', mock);
    }));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      var $state = $injector.get('$state');

      modelManager = $injector.get('app.model.modelManager');
      apiManager = $injector.get('app.api.apiManager');
      var accountModel = modelManager.retrieve('app.model.account');
      accountModel.isAdmin = function () {
        return true;
      };

      var notificationService = $injector.get('app.view.notificationsService');
      var hceReg = $injector.get('app.view.hceRegistration');
      var log = $injector.get('$log');

      var credentialsDialog = $injector.get('app.view.credentialsDialog');
      var confirmDialogMock = function (dialogSpecs) {

        dialogSpecs.callback();
      };
      var EndpointsViewController = $state.get('endpoint.hce').controller;
      controller = new EndpointsViewController(log, $q, modelManager, apiManager, hceReg, notificationService, confirmDialogMock, credentialsDialog);
      userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
      spyOn(userServiceInstanceModel, 'disconnect').and.callThrough();
      spyOn(serviceInstanceModel, 'remove').and.callThrough();
      spyOn(controller, '_updateCurrentEndpoints').and.callThrough();

      $httpBackend.when('GET', '/pp/v1/proxy/v2/info').respond(200, {});
      $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, items);
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, items);
      $httpBackend.whenGET('/pp/v1/proxy/info').respond(200, {});
    }));

    describe('controller tests', function () {

      it('should have `serviceInstances` property initially be {}', function () {
        expect(controller.serviceInstances).toEqual({});
      });

      it('should show cluster registration detail view when showClusterAddForm is invoked', function () {
        controller.showClusterAddForm();
        expect(detailViewCalled).toBe(true);
      });

      it('should invoke disconnection', function () {

        userServiceInstanceModel.list().then(function () {
          controller.disconnect(items[0]);
          $httpBackend.flush();
          expect(userServiceInstanceModel.disconnect).toHaveBeenCalled();
        });
      });

      it('should invoke unregister', function () {

        serviceInstanceModel.list().then(function () {
          controller.unregister({model: items[0]});
          $httpBackend.flush();
          expect(userServiceInstanceModel.disconnect).toHaveBeenCalled();
        });
      });

      it('should open credentials form on connect', function () {
        controller.connect({});
        expect(controller.dialog).toBeTruthy();
        expect(controller.activeServiceInstance).toBeDefined();
      });

      it('should return correct submenu when instance has not expired and connected', function () {
        var endpoint = {
          expxired: false,
          connected: true
        };
        var menu = controller.getActions(endpoint);
        expect(menu[0].name).toEqual('Disconnect');
      });

      it('should return  correct submenu when instance has not expired and disconnected', function () {
        var endpoint = {
          expxired: false,
          connected: false
        };
        var menu = controller.getActions(endpoint);
        expect(menu[0].name).toEqual('Connect');
      });

      it('should return  correct submenu when instance has expired', function () {
        var endpoint = {
          expxired: true
        };
        var menu = controller.getActions(endpoint);
        expect(menu[0].name).toEqual('Connect');
      });

      it('should dismiss modal when connect succeeds', function () {

        controller.onConnectSuccess();
        $httpBackend.flush();
        expect(controller.dialog).toBeFalsy();
        expect(controller._updateCurrentEndpoints).toHaveBeenCalled();

      });

      // menu action tests
      it('should invoke disconnect action', function () {
        var endpoint = {
          expxired: false,
          connected: true,
          model: {
            guid: 'guid',
            cnsi_type: 'hce',
            account: {},
            token_expiry: {},
            valid: true
          }
        };

        controller.userServiceInstanceModel.serviceInstances.guid = endpoint.model;
        var menu = controller.getActions(endpoint);
        menu[0].execute(endpoint);
        $httpBackend.expectPOST('/pp/v1/auth/logout/cnsi').respond(200, {});
        $httpBackend.expectGET('/pp/v1/proxy/info').respond(200, {});
        $httpBackend.flush();

      });

      it('should have Unregister action', function () {

        var endpoint = {
          expxired: false
        };

        controller.serviceInstanceModel.serviceInstances = items;

        var menu = controller.getActions(endpoint);
        expect(menu[1].name).toEqual('Unregister');

        spyOn(controller, 'unregister').and.callThrough();
        menu[1].execute(items[0]);
        expect(controller.unregister).toHaveBeenCalled();

        $httpBackend.expectPOST('/pp/v1/unregister').respond(200, {});
        $httpBackend.expectGET('/pp/v1/proxy/info').respond(200, {});
        $httpBackend.flush();

      });

      it('should not show empty view if endpoints are present', function () {

        controller.resolvedUpdateCurrentEndpoints = true;
        controller.currentEndpoints = items;
        var showEmpty = controller.showEmptyView();
        expect(showEmpty).toBeFalsy();
      });

      it('should not show list view if endpoints are empty', function () {
        controller.currentEndpoints = [];
        var showListView = controller.showListView();
        expect(showListView).toBeFalsy();
      });

      it('should show empty view if endpoints are empty', function () {

        controller.resolvedUpdateCurrentEndpoints = true;
        controller.currentEndpoints = [];
        var showEmpty = controller.showEmptyView();
        expect(showEmpty).toBeTruthy();
      });

      it('should show list view if endpoints are not empty', function () {
        controller.resolvedUpdateCurrentEndpoints = true;
        controller.currentEndpoints = items;
        var showListView = controller.showListView();
        expect(showListView).toBeTruthy();
      });

    });
  });

})();
