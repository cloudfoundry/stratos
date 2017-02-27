(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.cpu-summary', [
      'control-plane.view.metrics.dashboard.cpu-summary.cards',
      'control-plane.view.metrics.dashboard.cpu-summary.list'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.cpu-summary', {
      url: '/cpu',
      params: {
        newlyCreated: false
      },
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/cpu-summary/cpu-summary.html',
      controller: CpuSummaryController,
      controllerAs: 'cpuSummaryCtrl'
    });
  }

  CpuSummaryController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function CpuSummaryController($q, $state, $stateParams, modelManager, utilsService, metricsDataService) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');

    var metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    var controlPlaneModel = modelManager.retrieve('control-plane.model');
    this.guid = $stateParams.guid;

    this.totalCpuUsageTile = gettext('');

    this.sortFilters = [
      {
        label: gettext('Hostname'),
        value: 'spec.hostname'
      },
      {
        label: gettext('Utilization'),
        value: 'metric.cpu_utilization'
      }
    ];

    this.defaultFilter = {
      label: gettext('Hostname'),
      value: 'spec.hostname'
    };

    function init() {
      metricsDataService.setSortFilters('cpu', that.sortFilters, that.defaultFilter);
      return $q.resolve();
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.cpu-summary', $state, init);

  }

  angular.extend(CpuSummaryController.prototype, {});

})();
