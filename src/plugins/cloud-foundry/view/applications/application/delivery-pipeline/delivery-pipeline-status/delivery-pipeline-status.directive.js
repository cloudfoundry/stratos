(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.delivery-pipeline')
    .directive('deliveryPipelineStatus', deliveryPipelineStatus);

  deliveryPipelineStatus.$inject = [];

  /**
   * @memberof cloud-foundry.view.applications
   * @name deliveryPipelineStatus
   * @description A dierctive for showing the delivery pipeline status
   * @returns {object} The delivery-pipeline-status directive definition object
   */
  function deliveryPipelineStatus() {
    return {
      scope: {
        pipeline: '=',
        hce: '='
      },
      templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-pipeline/delivery-pipeline-status/delivery-pipeline-status.html',
      controller: ApplicationSetupPipelineController,
      controllerAs: 'applicationSetupPipelineCtrl'
    };
  }

  ApplicationSetupPipelineController.$inject = [
    'app.event.eventService'
  ];

  /**
   * @name ApplicationSetupPipelineController
   * @constructor
   * @param {app.event.eventService} eventService - the Event management service
   * @property {app.event.eventService} eventService - the Event management service
   */
  function ApplicationSetupPipelineController(eventService) {
    this.eventService = eventService;
  }

  angular.extend(ApplicationSetupPipelineController.prototype, {
    /**
     * @function setupPipeline
     * @memberOf cloud-foundry.view.applications.ApplicationSetupPipelineController
     * @description trigger add pipeline workflow
     */
    setupPipeline: function () {
      this.eventService.$emit('cf.events.START_ADD_PIPELINE_WORKFLOW');
    }
  });

})();
