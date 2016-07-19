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
				'pipeline': '='
			},
      templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-pipeline/delivery-pipeline-status/delivery-pipeline-status.html'
    };
  }
})();
