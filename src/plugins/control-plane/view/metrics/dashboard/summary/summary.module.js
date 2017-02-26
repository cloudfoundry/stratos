(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.summary', [
      'control-plane.view.metrics.dashboard.summary.card',
      'control-plane.view.metrics.dashboard.summary.list'
    ])
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
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/summary/summary.html',
      controller: MetricsSummaryController,
      controllerAs: 'metricsSummaryCtrl'
    });
  }

  MetricsSummaryController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function MetricsSummaryController($q, $state, $stateParams, utilsService, metricsDataService) {
    var that = this;

    this.guid = $stateParams.guid;

    this.showCardLayout = true;

    this.sortFilters = [
      {
        label: gettext('Hostname'),
        value: 'spec.hostname'
      },
      {
        label: gettext('Memory'),
        value: 'metric.memory_utilization'
      },
      {
        label: gettext('CPU'),
        value: 'metric.cpu_utilization'
      },
      {
        label: gettext('Availability Zone'),
        value: 'spec.zone'
      },
      {
        label: gettext('Data Transmitted Rate'),
        value: 'metric.dataTxRate'
      },
      {
        label: gettext('Data Received Rate'),
        value: 'metric.dataRxRate'
      }
    ];

    this.defaultFilter = {
      label: gettext('Hostname'),
      value: 'spec.hostname'
    };


    function init() {

      metricsDataService.setSortFilters('nodes', that.sortFilters, that.defaultFilter);
      return $q.resolve();
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary', $state, init);

  }

  angular.extend(MetricsSummaryController.prototype, {});

})();
