(function () {
  'use strict';

  angular
    .module('code-engine.view.application.delivery-pipeline')
    .directive('ceDeliveryPipelineStatus', ceDeliveryPipelineStatus);

  /**
   * @memberof code-engine.view.applications
   * @name ceDeliveryPipelineStatus
   * @description A directive for showing the delivery pipeline status
   * @returns {object} The ce-delivery-pipeline-status directive definition object
   */
  function ceDeliveryPipelineStatus() {
    return {
      scope: {
        pipeline: '=',
        hce: '=',
        setup: '='
      },
      templateUrl: 'plugins/code-engine/view/application/delivery-pipeline/delivery-pipeline-status/delivery-pipeline-status.html',
      controller: ApplicationSetupPipelineController,
      controllerAs: 'applicationSetupPipelineCtrl',
      bindToController: true
    };
  }

  /**
   * @name ApplicationSetupPipelineController
   * @param {object} $scope  - the Angular $scope
   * @constructor
   */
  function ApplicationSetupPipelineController($scope) {

    var vm = this;

    vm.setupPipeline = setupPipeline;

    /**
     * @function setupPipeline
     * @memberOf code-engine.view.applicationSetupPipelineController
     * @description trigger add pipeline workflow
     */
    function setupPipeline() {
      if (angular.isFunction($scope.setup)) {
        $scope.setup();
      }
    }

  }

})();
