(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.data-traffic-rate-summary', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.network-traffic-rate-summary', {
      url: '/network-traffic',
      params: {
        guid: ''
      },
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/data-traffic-rate-summary/data-traffic-rate-summary.html',
      controller: DataTrafficRateSummaryController,
      controllerAs: 'dataTrafficRateSummaryCtrl',
      ncyBreadcrumb: {
        label: '{{metricsDashboardCtrl.endpoint.name}}',
        parent: 'cp.tiles'
      }
    });
  }

  DataTrafficRateSummaryController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function DataTrafficRateSummaryController($q, $state, $stateParams, modelManager, utilsService, metricsDataService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('control-plane.model.metrics');
    this.utilsService = utilsService;
    this.guid = $stateParams.guid;
    this.metricsDataService = metricsDataService;
    this.sortFilters = [
      {
        label: gettext('Hostname'),
        value: 'spec.hostname'
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

    if (!_.has(metricsDataService, 'dataTrafficRate.showCardLayout')) {
      this.metricsDataService.dataTrafficRate = {};
      this.metricsDataService.dataTrafficRate.showCardLayout = true;
    }

    this.tableColumns = [
      {name: gettext('Node'), value: 'spec.hostname'},
      {name: gettext('Data Tx Rate'), value: 'metrics.dataTxData', noSort: true},
      {name: gettext('Current Tx Rate'), value: 'metrics.dataTxRate', descendingFirst: true},
      {name: gettext('Data Rx Rate'), value: 'metrics.dataRxData', noSort: true},
      {name: gettext('Current Rx Rate'), value: 'metrics.dataRxRate', descendingFirst: true}
    ];

    function init() {
      metricsDataService.setSortFilters('data-traffic-rate', that.sortFilters, that.defaultFilter);
      that.nodes = metricsDataService.getNodes(that.guid);
      that.filteredNodes = [].concat(that.nodes);
      return $q.resolve().then(function () {
        // Enrich nodes information

        var allMetricPromises = [];
        _.each(that.nodes, function (node, key) {

          var metricPromises = [];
          // network Rx
          metricPromises.push(that.metricsModel.getMetrics('network_rx_rate_gauge',
            that.metricsModel.makeNodeNameFilter(node.spec.metricsNodeName)));
          // network Rx rate
          metricPromises.push(that.metricsModel.getNetworkRxRate(node.spec.metricsNodeName));
          // network Tx
          metricPromises.push(that.metricsModel.getMetrics('network_tx_rate_gauge',
            that.metricsModel.makeNodeNameFilter(node.spec.metricsNodeName)));
          // network Tx rate
          metricPromises.push(that.metricsModel.getNetworkTxRate(node.spec.metricsNodeName));

          var promises = $q.all(metricPromises)
            .then(function (metrics) {
              that.nodes[key].metrics = {};
              that.nodes[key].metrics.dataRxData = metrics[0] && metrics[0].timeSeries;
              that.nodes[key].metrics.dataRxRate = utilsService.bytesToHumanSize(metrics[1]) + '/s';
              that.nodes[key].metrics.dataTxData = metrics[2] && metrics[2].timeSeries;
              that.nodes[key].metrics.dataTxRate = utilsService.bytesToHumanSize(metrics[3]) + '/s';
            });

          allMetricPromises.push(promises);

        });
        return allMetricPromises;
      });
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.network-traffic-rate-summary', $state, init);

  }

  angular.extend(DataTrafficRateSummaryController.prototype, {});

})();
