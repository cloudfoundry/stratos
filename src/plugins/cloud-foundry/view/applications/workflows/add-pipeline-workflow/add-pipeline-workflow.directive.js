(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('addPipelineWorkflow', addPipelineWorkflow)
    .run(run);

  addPipelineWorkflow.$inject = [];

  /**
   * @memberof cloud-foundry.view.applications
   * @name addAppWorkflow
   * @description An add-app-workflow directive
   * @returns {object} The add-app-workflow directive definition object
   */
  function addPipelineWorkflow() {
    return {
      controller: AddPipelineWorkflowController,
      controllerAs: 'addPipelineWorkflowCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-pipeline-workflow/add-pipeline-workflow.html'
    };
  }

  AddPipelineWorkflowController.$inject = [
    'app.event.eventService'
  ];

  /**
   * @memberof cloud-foundry.view.applications
   * @name AddAppWorkflowController
   * @constructor
   * @param {app.event.eventService} eventService - the Event management service
   * @property {app.event.eventService} eventService - the event bus service
   */
  function AddPipelineWorkflowController(eventService) {
    this.eventService = eventService;
    this.init();
  }

  run.$inject = [
    'cloud-foundry.view.applications.workflows.add-pipeline-workflow.prototype'
  ];

  function run(addPipelineWorkflowPrototype) {
    angular.extend(AddPipelineWorkflowController.prototype, addPipelineWorkflowPrototype, {
    });
  }

})();
