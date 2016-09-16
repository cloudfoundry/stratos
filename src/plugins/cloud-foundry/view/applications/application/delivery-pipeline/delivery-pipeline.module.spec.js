(function () {
  'use strict';

  describe('Delivery Pipeline', function () {

    var controller, eventService, $interpolate, $state, $stateParams, $rootScope, cnsiModel, userCnsiModel,
      modelManager, $httpBackend, account;

    beforeEach(module('green-box-console'));
    beforeEach(module('cloud-foundry.view.applications.application.delivery-pipeline'));

    // Define some common properties used throughout tests
    var application = {
      summary: {
        name: 'appName'
      },
      pipeline: {
        fetching: false
      }
    };

    beforeEach(inject(function ($injector) {
      // Create the parameters required by the ctor
      eventService = $injector.get('app.event.eventService');
      $interpolate = $injector.get('$interpolate');
      $state = $injector.get('$state');
      $stateParams = $injector.get('$stateParams');
      modelManager = $injector.get('app.model.modelManager');

      // Some generic vars needed in tests
      $rootScope = $injector.get('$rootScope');
      $httpBackend = $injector.get('$httpBackend');

      // Store the model functions that the constructor calls out to. These functions will be monitored and overwritten
      var model = modelManager.retrieve('cloud-foundry.model.application');
      _.set(model, 'application', application);
      cnsiModel = modelManager.retrieve('app.model.serviceInstance');
      userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
      account = modelManager.retrieve('app.model.account');
    }));

    function createController() {
      var ApplicationDeliveryPipelineController = $state.get('cf.applications.application.delivery-pipeline').controller;
      controller = new ApplicationDeliveryPipelineController(eventService, modelManager, $interpolate, $stateParams, $rootScope.$new(), null);
      expect(controller).toBeDefined();
    }

    afterEach(function () {
      // Not necessarily needed, but will catch any requests that have not been overwritten.
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Check HCE status', function () {
      it('Non-admin user with no services', function () {
        account.data = {isAdmin: false};
        createController();
        expect(controller.hceServices.fetching).toBe(false);
        expect(controller.hceServices.valid).toBe(0);
        expect(controller.hceServices.available).toBe(0);
        expect(controller.hceServices.isAdmin).toBe(false);
      });

      it('Admin user with no services', function () {
        account.data = {isAdmin: true};
        createController();
        expect(controller.hceServices.fetching).toBe(false);
        expect(controller.hceServices.valid).toBe(0);
        expect(controller.hceServices.available).toBe(0);
        expect(controller.hceServices.isAdmin).toBe(true);
      });

      it('User with valid services', function () {
        _.set(userCnsiModel, 'serviceInstances', {
          guid: {
            cnsi_type: 'hce',
            valid: true
          }
        });
        account.data = {isAdmin: true};
        createController();
        expect(controller.hceServices.fetching).toBe(false);
        expect(controller.hceServices.valid).toBe(1);
        expect(controller.hceServices.available).toBe(0);
        expect(controller.hceServices.isAdmin).toBe(true);
      });

      it('User with available and valid services', function () {
        _.set(cnsiModel, 'serviceInstances', {
          guid_1: {
            cnsi_type: 'hce'
          },
          guid_2: {
            cnsi_type: 'hce'
          }
        });
        _.set(userCnsiModel, 'serviceInstances', {
          guid_1: {
            cnsi_type: 'hce',
            valid: true
          },
          guid_2: {
            cnsi_type: 'hce',
            valid: false
          }
        });
        account.data = {isAdmin: true};
        createController();
        expect(controller.hceServices.fetching).toBe(false);
        expect(controller.hceServices.valid).toBe(1);
        expect(controller.hceServices.available).toBe(2);
        expect(controller.hceServices.isAdmin).toBe(true);
      });
    });
  });

})();
