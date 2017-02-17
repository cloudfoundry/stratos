(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.memory-summary', [
      'control-plane.view.metrics.dashboard.memory-summary.list',
      'control-plane.view.metrics.dashboard.memory-summary.cards'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.memory-summary', {
      url: '/memory',
      params: {
        newlyCreated: false
      },
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/memory-summary/memory-summary.html',
      controller: MemorySummaryController,
      controllerAs: 'memorySummaryCtrl'
    });
  }

  MemorySummaryController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function MemorySummaryController($q, $state, $stateParams, modelManager, utilsService, metricsDataService) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');

    var metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    var controlPlaneModel = modelManager.retrieve('control-plane.model');
    this.utilsService = utilsService;
    this.guid = $stateParams.guid;

    this.totalMemoryUsageTile = gettext('Total Memory Usage');

    function init() {
      return $q.resolve();
    }
    utilsService.chainStateResolve('cp.metrics.dashboard.memory-summary', $state, init);

  }

  angular.extend(MemorySummaryController.prototype, {});

})();
