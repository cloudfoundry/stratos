(function () {
  'use strict';

  describe('add-service-workflow directive', function () {
    var $httpBackend, $scope, eventService, mockApp, mockService, addServiceWorkflowCtrl;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      eventService = $injector.get('app.event.eventService');

      var markup = '<add-service-workflow></add-service-workflow>';
      var element = angular.element(markup);
      $compile(element)($scope);

      $scope.$apply();

      addServiceWorkflowCtrl = element.controller('addServiceWorkflow');
      spyOn(addServiceWorkflowCtrl, 'reset').and.callThrough();
      spyOn(addServiceWorkflowCtrl, 'startWorkflow').and.callThrough();

      mockService = {
        entity: { extra: '{"displayName":"Service","longDescription":"Service description"}' },
        metadata: { guid: 'b2728c78-1057-4021-9c84-d2158f8f20df' }
      };

      // mock CF application model
      var mockAppsApi = mock.cloudFoundryAPI.Apps;
      var GetAppSummary = mockAppsApi.GetAppSummary('app_123');
      mockApp = GetAppSummary.response['200'].body.guid;
      $httpBackend.whenGET(GetAppSummary.url)
        .respond(200, GetAppSummary.response['200'].body);
      // mock CF services models
      var mockServicesApi = mock.cloudFoundryAPI.Services;
      var ListAllServicePlansForService = mockServicesApi.ListAllServicePlansForService(mockService.metadata.guid);
      $httpBackend.whenGET(ListAllServicePlansForService.url)
        .respond(200, ListAllServicePlansForService.response['200'].body);
      // mock CF spaces model
      var mockSpacesApi = mock.cloudFoundryAPI.Spaces;
      var ListAllServiceInstancesForSpace = mockSpacesApi.ListAllServiceInstancesForSpace(mockApp.space_guid);
      var params = '?inline-relations-depth=2&q=service_plan_guid+IN+a5ac915f-b746-42c5-8506-6d318bf21107';
      $httpBackend.whenGET(ListAllServiceInstancesForSpace.url + params)
        .respond(200, ListAllServiceInstancesForSpace.response['200'].body);
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should have modal initialized to null', function () {
      expect(addServiceWorkflowCtrl.modal).toBe(null);
    });

    it('should call reset and startWorkflow on event received', function () {
      var event = 'cf.events.START_ADD_SERVICE_WORKFLOW';
      var config = {
        app: {
          summary: mockApp
        },
        confirm: true,
        cnsiGuid: 'guid',
        service: mockService
      };
      eventService.$emit(event, config);

      $scope.$apply();
      $httpBackend.flush();

      expect(addServiceWorkflowCtrl.reset).toHaveBeenCalled();
      expect(addServiceWorkflowCtrl.startWorkflow).toHaveBeenCalled();
    });

    describe('reset', function () {
      it('should reset workflow two steps', function () {
        spyOn(addServiceWorkflowCtrl, 'getServicePlans').and.callThrough();
        spyOn(addServiceWorkflowCtrl, 'getServiceInstances').and.callThrough();

        var config = {
          app: {
            summary: mockApp
          },
          confirm: true,
          cnsiGuid: 'guid',
          service: mockService
        };
        addServiceWorkflowCtrl.reset(config);

        $httpBackend.flush();

        expect(addServiceWorkflowCtrl.getServicePlans).toHaveBeenCalled();
        expect(addServiceWorkflowCtrl.getServiceInstances).toHaveBeenCalled();

        // Workflow data should be defined
        expect(addServiceWorkflowCtrl.data).toBeDefined();
        expect(addServiceWorkflowCtrl.data.workflow).toBeDefined();
        expect(addServiceWorkflowCtrl.data.workflow.steps.length).toBe(2);
        expect(addServiceWorkflowCtrl.data.workflow.steps[0].onNext).toBeDefined();
        expect(addServiceWorkflowCtrl.options).toBeDefined();
        expect(addServiceWorkflowCtrl.options.instances.length).toBeGreaterThan(0);
        expect(addServiceWorkflowCtrl.options.instanceNames.length).toBeGreaterThan(0);
        expect(addServiceWorkflowCtrl.options.servicePlans.length).toBeGreaterThan(0);
        expect(addServiceWorkflowCtrl.options.servicePlanMap).toBeDefined();
      });

      it('should reset workflow with one step', function () {
        spyOn(addServiceWorkflowCtrl, 'getServicePlans').and.callThrough();
        spyOn(addServiceWorkflowCtrl, 'getServiceInstances').and.callThrough();

        var config = {
          app: {
            summary: mockApp
          },
          confirm: false,
          cnsiGuid: 'guid',
          service: mockService
        };
        addServiceWorkflowCtrl.reset(config);

        $httpBackend.flush();

        // Workflow data should be defined
        expect(addServiceWorkflowCtrl.data.workflow.steps.length).toBe(1);
        expect(addServiceWorkflowCtrl.data.workflow.steps[0].onNext).toBeUndefined();
        expect(addServiceWorkflowCtrl.data.workflow.steps[0].isLastStep).toBeTruthy();
        expect(addServiceWorkflowCtrl.data.workflow.allowCancelAtLastStep).toBeTruthy();
      });
    });

    describe('addService', function () {
      beforeEach(function () {
        var config = {
          app: {
            summary: mockApp
          },
          confirm: false,
          cnsiGuid: 'guid',
          service: mockService
        };
        addServiceWorkflowCtrl.reset(config);
      });

      it('should add new service instance', function () {
        // mock CF service instances model
        var newInstanceSpec = {
          name: 'New Instance',
          service_plan_guid: 'a5ac915f-b746-42c5-8506-6d318bf21107',
          space_guid: mockApp.space_guid
        };
        var mockInstancesApi = mock.cloudFoundryAPI.ServiceInstances;
        var CreateServiceInstance = mockInstancesApi.CreateServiceInstance(newInstanceSpec);
        $httpBackend.whenPOST(CreateServiceInstance.url)
          .respond(200, CreateServiceInstance.response['200'].body);

        addServiceWorkflowCtrl.userInput.name = 'New Instance';
        addServiceWorkflowCtrl.userInput.plan = {
          metadata: { guid: 'a5ac915f-b746-42c5-8506-6d318bf21107' }
        };
        addServiceWorkflowCtrl.addService().then(function () {
          expect(addServiceWorkflowCtrl.options.servicePlan).not.toBe(null);
          expect(addServiceWorkflowCtrl.options.serviceInstance).not.toBe(null);
        });

        $httpBackend.flush();
      });

      it('should not add service with error', function () {
        // mock CF service instances model
        var mockInstancesApi = mock.cloudFoundryAPI.ServiceInstances;
        var CreateServiceInstance = mockInstancesApi.CreateServiceInstance({});
        $httpBackend.whenPOST(CreateServiceInstance.url)
          .respond(200, CreateServiceInstance.response['400'].body);

        addServiceWorkflowCtrl.userInput.plan = {
          metadata: { guid: 'a5ac915f-b746-42c5-8506-6d318bf21107' }
        };
        addServiceWorkflowCtrl.addService().then(angular.noop, function () {
          expect(addServiceWorkflowCtrl.options.serviceInstance).toBe(null);
        });

        $httpBackend.flush();
      });

      it('should set existing service instance', function () {
        addServiceWorkflowCtrl.options.isCreateNew = false;

        $httpBackend.flush();

        var firstInstance = addServiceWorkflowCtrl.options.instances[0];
        addServiceWorkflowCtrl.userInput.existingServiceInstance = firstInstance;

        addServiceWorkflowCtrl.addService().then(function () {
          expect(addServiceWorkflowCtrl.options.servicePlan).not.toBe(null);
          expect(addServiceWorkflowCtrl.options.serviceInstance).not.toBe(null);
          expect(addServiceWorkflowCtrl.options.serviceInstance).toEqual(firstInstance);
        });
      });
    });

    describe('addBinding', function () {
      it('should add binding', function () {
        spyOn(addServiceWorkflowCtrl.appModel, 'getAppSummary').and.callThrough();

        var newBindingSpec = {
          app_guid: 'app_123',
          service_instance_guid: 'instance_123'
        };
        // mock CF service bindings model
        var mockBindingsApi = mock.cloudFoundryAPI.ServiceBindings;
        var CreateServiceBinding = mockBindingsApi.CreateServiceBinding(newBindingSpec);
        $httpBackend.whenPOST(CreateServiceBinding.url)
          .respond(200, CreateServiceBinding.response['200'].body);

        addServiceWorkflowCtrl.options = {
          serviceInstance: {
            metadata: { guid: 'instance_123' }
          }
        };
        addServiceWorkflowCtrl.data = {
          app: {
            summary: { guid: 'app_123' }
          },
          cnsiGuid: 'guid'
        };

        addServiceWorkflowCtrl.addBinding().then(function () {
          expect(addServiceWorkflowCtrl.appModel.getAppSummary).toHaveBeenCalled();
        });

        $httpBackend.flush();
      });

      it('should not add binding with error', function () {
        spyOn(addServiceWorkflowCtrl.appModel, 'getAppSummary').and.callThrough();

        // mock CF service bindings model
        var mockBindingsApi = mock.cloudFoundryAPI.ServiceBindings;
        var CreateServiceBinding = mockBindingsApi.CreateServiceBinding({});
        $httpBackend.whenPOST(CreateServiceBinding.url)
          .respond(200, CreateServiceBinding.response['400'].body);

        addServiceWorkflowCtrl.options = {
          serviceInstance: {
            metadata: { guid: 'instance_123' }
          }
        };
        addServiceWorkflowCtrl.data = {
          app: {
            summary: { guid: 'app_123' }
          },
          cnsiGuid: 'guid'
        };
        addServiceWorkflowCtrl.addBinding().then(angular.noop, function () {
          expect(addServiceWorkflowCtrl.appModel.getAppSummary).not.toHaveBeenCalled();
        });

        $httpBackend.flush();
      });
    });

    describe('stopWorkflow', function () {
      it('should close modal', function () {
        addServiceWorkflowCtrl.modal = {
          close: angular.noop
        };

        spyOn(addServiceWorkflowCtrl.modal, 'close').and.callThrough();

        addServiceWorkflowCtrl.stopWorkflow();

        expect(addServiceWorkflowCtrl.modal.close).toHaveBeenCalled();
      });
    });

    describe('finishWorkflow', function () {
      it('should add service instance and binding if confirm', function () {
        var newInstanceSpec = {
          name: 'New Instance',
          service_plan_guid: 'a5ac915f-b746-42c5-8506-6d318bf21107',
          space_guid: mockApp.space_guid
        };
        var mockInstancesApi = mock.cloudFoundryAPI.ServiceInstances;
        var CreateServiceInstance = mockInstancesApi.CreateServiceInstance(newInstanceSpec);
        $httpBackend.whenPOST(CreateServiceInstance.url)
          .respond(200, CreateServiceInstance.response['200'].body);

        var newBindingSpec = {
          app_guid: 'app_123',
          service_instance_guid: 'instance_123'
        };
        var mockBindingsApi = mock.cloudFoundryAPI.ServiceBindings;
        var CreateServiceBinding = mockBindingsApi.CreateServiceBinding(newBindingSpec);
        $httpBackend.whenPOST(CreateServiceBinding.url)
          .respond(200, CreateServiceBinding.response['200'].body);

        var config = {
          app: {
            summary: mockApp
          },
          confirm: false,
          cnsiGuid: 'guid',
          service: mockService
        };
        addServiceWorkflowCtrl.reset(config);
        addServiceWorkflowCtrl.options.isCreateNew = false;
        addServiceWorkflowCtrl.modal = {
          close: angular.noop
        };

        spyOn(addServiceWorkflowCtrl, 'addService').and.callThrough();
        spyOn(addServiceWorkflowCtrl, 'addBinding').and.callThrough();
        spyOn(addServiceWorkflowCtrl.modal, 'close').and.callThrough();

        $httpBackend.flush();

        var firstInstance = addServiceWorkflowCtrl.options.instances[0];
        addServiceWorkflowCtrl.userInput.existingServiceInstance = firstInstance;

        addServiceWorkflowCtrl.finishWorkflow();

        $httpBackend.flush();

        expect(addServiceWorkflowCtrl.addService).toHaveBeenCalled();
        expect(addServiceWorkflowCtrl.addBinding).toHaveBeenCalled();
        expect(addServiceWorkflowCtrl.modal.close).toHaveBeenCalled();
      });

      it('should close modal if no confirm', function () {
        addServiceWorkflowCtrl.data = { confirm: true };
        addServiceWorkflowCtrl.modal = {
          close: angular.noop
        };

        spyOn(addServiceWorkflowCtrl, 'addService').and.callThrough();
        spyOn(addServiceWorkflowCtrl, 'addBinding').and.callThrough();
        spyOn(addServiceWorkflowCtrl.modal, 'close').and.callThrough();

        addServiceWorkflowCtrl.finishWorkflow();

        expect(addServiceWorkflowCtrl.addService).not.toHaveBeenCalled();
        expect(addServiceWorkflowCtrl.addBinding).not.toHaveBeenCalled();
        expect(addServiceWorkflowCtrl.modal.close).toHaveBeenCalled();
      });
    });
  });

})();
