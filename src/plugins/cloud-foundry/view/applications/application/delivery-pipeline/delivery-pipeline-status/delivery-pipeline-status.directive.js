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
    'helion.framework.widgets.detailView'
  ];

  /**
   * @name ApplicationSetupPipelineController
   * @constructor
   * @param {helion.framework.widgets.detailView} detailView - The console's detailView service
   * @property {helion.framework.widgets.detailView} detailView - The console's detailView service
   */
  function ApplicationSetupPipelineController(detailView) {
    this.detailView = detailView;
  }

  angular.extend(ApplicationSetupPipelineController.prototype, {
    /**
     * @function setupPipeline
     * @memberOf cloud-foundry.view.applications.ApplicationSetupPipelineController
     * @description trigger add pipeline workflow
     */
    setupPipeline: function () {
      this.detailView(
        {
          templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-pipeline-workflow/add-pipeline-dialog.html'
        }
      );
    }
  });

})();
