(function () {
  'use strict';

  describe('add-pipeline-workflow directive', function () {
    var $httpBackend, $scope, addPipelineWorkflowCtrl, mockApp;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      $scope.testDismiss = function () {};
      $scope.testClose = function () {};

      var modelManager = $injector.get('modelManager');
      var application = modelManager.retrieve('cloud-foundry.model.application').application;
      application.summary = {
        routes: [{}]
      };

      $httpBackend.whenGET('/pp/v1/cnsis/registered').respond(200, {});
      $httpBackend.expectGET('/pp/v1/cnsis/registered');
      var markup = '<add-pipeline-workflow close-dialog="testClose" dismiss-dialog="testDismiss"></add-pipeline-workflow>';
      var element = angular.element(markup);
      $compile(element)($scope);
      $scope.$apply();
      addPipelineWorkflowCtrl = element.controller('addPipelineWorkflow');
      var mockAppsApi = mock.cloudFoundryAPI.Apps;
      var GetAppSummary = mockAppsApi.GetAppSummary('app_123');
      mockApp = GetAppSummary.response['200'].body;
      $httpBackend.flush();
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should have controller', function () {
      expect(addPipelineWorkflowCtrl).toBeDefined();
    });

    describe('after reset', function () {
      var application, route, host, domain;

      beforeEach(function () {
        var appModel = addPipelineWorkflowCtrl.modelManager.retrieve('cloud-foundry.model.application');
        appModel.application = {
          summary: mockApp
        };
        application = appModel.application;
        route = application.summary.routes[0];
        host = route.host;
        domain = { entity: route.domain };
        addPipelineWorkflowCtrl.reset();
      });

      it('should have been reset properly', function () {
        expect(addPipelineWorkflowCtrl.userInput.name).toBe(application.summary.name);
        expect(addPipelineWorkflowCtrl.userInput.serviceInstance).toBe(application.cluster);
        expect(addPipelineWorkflowCtrl.userInput.clusterUsername).toBe(null);
        expect(addPipelineWorkflowCtrl.userInput.clusterPassword).toBe(null);
        expect(addPipelineWorkflowCtrl.userInput.organization).toBe(application.organization);
        expect(addPipelineWorkflowCtrl.userInput.space).toBe(application.space);
        expect(addPipelineWorkflowCtrl.userInput.host).toBe(host);
        expect(addPipelineWorkflowCtrl.userInput.domain).toEqual(domain);
        expect(addPipelineWorkflowCtrl.userInput.application).toBe(application);
        expect(addPipelineWorkflowCtrl.userInput.hceCnsi).toBe(null);
        expect(addPipelineWorkflowCtrl.userInput.source).toBe(null);
        expect(addPipelineWorkflowCtrl.userInput.repo).toBe(null);
        expect(addPipelineWorkflowCtrl.userInput.repoFilterTerm).toBe(null);
        expect(addPipelineWorkflowCtrl.userInput.branch).toBe(null);
        expect(addPipelineWorkflowCtrl.userInput.buildContainer).toBe(null);
        expect(addPipelineWorkflowCtrl.userInput.projectId).toBe(null);
        expect(addPipelineWorkflowCtrl.userInput.imageRegistry).toBe(null);
        expect(addPipelineWorkflowCtrl.userInput.searchCategory).toBe('all');
        expect(addPipelineWorkflowCtrl.userInput.search.entity.extra).toBe(undefined);
        expect(addPipelineWorkflowCtrl.data.workflow.allowJump).toBe(false);
        expect(addPipelineWorkflowCtrl.data.workflow.allowBack()).toBe(true);
        expect(addPipelineWorkflowCtrl.data.workflow.title).toBe('Add Pipeline');
        expect(addPipelineWorkflowCtrl.data.workflow.steps.length).toBe(6);
      });

      it('step 2 - onEnter', function () {
        spyOn(addPipelineWorkflowCtrl, 'getVcsInstances');
        var step = addPipelineWorkflowCtrl.data.workflow.steps[1];
        step.onEnter();
        expect(addPipelineWorkflowCtrl.getVcsInstances).toHaveBeenCalled();
      });

      it('addPipelineActions - stop', function () {
        spyOn(addPipelineWorkflowCtrl, 'stopWorkflow');
        addPipelineWorkflowCtrl.addPipelineActions.stop();
        expect(addPipelineWorkflowCtrl.stopWorkflow).toHaveBeenCalled();
      });

      it('addPipelineActions - finish', function () {
        var appModel = addPipelineWorkflowCtrl.modelManager.retrieve('cloud-foundry.model.application');
        spyOn(appModel, 'updateDeliveryPipelineMetadata');
        spyOn(addPipelineWorkflowCtrl, 'finishWorkflow');
        addPipelineWorkflowCtrl.addPipelineActions.finish();
        expect(appModel.updateDeliveryPipelineMetadata).toHaveBeenCalledWith(true);
        expect(addPipelineWorkflowCtrl.finishWorkflow).toHaveBeenCalled();
      });
    });
  });
})();
