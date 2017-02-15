(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.summary', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.summary', {
      url: '/summary',
      params: {
        guid: ''
      },
      templateUrl: 'plugins/control-plane/view/metrics/summary/summary.html',
      controller: MetricsSummaryController,
      controllerAs: 'metricsSummaryCtrl'
    });
  }

  MetricsSummaryController.$inject = [
    '$state',
    '$stateParams',
    '$log',
    '$q',
    '$scope',
    '$filter',
    'app.model.modelManager',
    'cloud-foundry.view.applications.application.summary.addRoutes',
    'cloud-foundry.view.applications.application.summary.editApp',
    'app.utils.utilsService',
    'app.view.endpoints.clusters.routesService',
    'helion.framework.widgets.dialog.confirm',
    'app.view.notificationsService'
  ];

  function MetricsSummaryController($state, $stateParams, $log, $q, $scope, $filter,
                                    modelManager, addRoutesService, editAppService, utils,
                                    routesService, confirmDialog, notificationsService) {

    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.guid = $stateParams.guid;
  }

  angular.extend(MetricsSummaryController.prototype, {});

})();
