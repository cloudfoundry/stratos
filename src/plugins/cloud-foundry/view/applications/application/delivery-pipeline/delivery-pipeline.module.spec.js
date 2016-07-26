(function () {
  'use strict';

  describe('Delivery Pipeline', function () {

    var controller, $state, $stateParams, $rootScope, cnsiModel, modelManager, $httpBackend, account;

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
      account = modelManager.retrieve('app.model.account');
    }));

    function createController() {
      var ApplicationDeliveryPipelineController = $state.get('cf.applications.application.delivery-pipeline').controller;
      controller = new ApplicationDeliveryPipelineController(modelManager, $stateParams, $rootScope.$new(), null);
      expect(controller).toBeDefined();
    }

    afterEach(function () {
      // Not necessarily needed, but will catch any requests that have not been overwritten.
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Check HCE status', function () {
      it('Non-admin user with no services', function () {
        $httpBackend.whenGET('/pp/v1/cnsis/registered').respond(200, []);
        $httpBackend.expectGET('/pp/v1/cnsis/registered');
        account.data = {isAdmin: false};
        createController();
        $httpBackend.flush();
        expect(controller.hceServices.fetching).toBe(false);
        expect(controller.hceServices.valid).toBe(0);
        expect(controller.hceServices.available).toBe(0);
        expect(controller.hceServices.isAdmin).toBe(false);
      });

      it('Admin user with no services', function () {
        $httpBackend.whenGET('/pp/v1/cnsis/registered').respond(200, []);
        $httpBackend.expectGET('/pp/v1/cnsis/registered');
        account.data = {isAdmin: true};
        createController();
        $httpBackend.flush();
        expect(controller.hceServices.fetching).toBe(false);
        expect(controller.hceServices.valid).toBe(0);
        expect(controller.hceServices.available).toBe(0);
        expect(controller.hceServices.isAdmin).toBe(true);
      });

      it('User with valid services', function () {
        $httpBackend.whenGET('/pp/v1/cnsis/registered').respond(200, [
          {
            cnsi_type: 'hce',
            valid: true
          }
        ]);
        $httpBackend.expectGET('/pp/v1/cnsis/registered');
        account.data = {isAdmin: true};
        createController();
        $httpBackend.flush();
        expect(controller.hceServices.fetching).toBe(false);
        expect(controller.hceServices.valid).toBe(1);
        expect(controller.hceServices.available).toBe(0);
        expect(controller.hceServices.isAdmin).toBe(true);
      });

      it('User with available and valid services', function () {
        $httpBackend.whenGET('/pp/v1/cnsis').respond(200, [
          {
            cnsi_type: 'hce',
            valid: true
          },
          {
            cnsi_type: 'hce',
            valid: true
          }
        ]);
        $httpBackend.expectGET('/pp/v1/cnsis');
        cnsiModel.list();
        $httpBackend.whenGET('/pp/v1/cnsis/registered').respond(200, [
          {
            cnsi_type: 'hce',
            valid: true
          }
        ]);
        $httpBackend.expectGET('/pp/v1/cnsis/registered');
        account.data = {isAdmin: true};
        createController();
        $httpBackend.flush();
        expect(controller.hceServices.fetching).toBe(false);
        expect(controller.hceServices.valid).toBe(1);
        expect(controller.hceServices.available).toBe(2);
        expect(controller.hceServices.isAdmin).toBe(true);
      });
    });
  });

})();
