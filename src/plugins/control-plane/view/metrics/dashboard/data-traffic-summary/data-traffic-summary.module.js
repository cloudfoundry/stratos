(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.data-traffic-summary', [
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.data-traffic-summary', {
      url: '/data-traffic',
      params: {
        guid: ''
      },
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/data-traffic-summary/data-traffic-summary.html',
      controller: DataTrafficSummaryController,
      controllerAs: 'dataTrafficSummaryCtrl',
      ncyBreadcrumb: {
        label: '{{metricsDashboardCtrl.endpoint.name}}',
        parent: 'cp.tiles'
      }
    });
  }

  DataTrafficSummaryController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function DataTrafficSummaryController($q, $state, $stateParams, modelManager, utilsService, metricsDataService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.utilsService = utilsService;
    this.guid = $stateParams.guid;
    this.showCardLayout = true;
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

    this.showCardLayout = true;

    this.tableColumns = [
      {name: gettext('Node'), value: 'spec.hostname'},
      {name: gettext('Data Transmitted'), value: 'metrics.dataTxData', noSort: true},
      {name: gettext('Transmission Rate'), value: 'metrics.dataTxRate', descendingFirst: true},
      {name: gettext('Data Received'), value: 'metrics.dataRxData', descendingFirst: true},
      {name: gettext('Receive Rate'), value: 'metrics.dataRxRate', descendingFirst: true}
    ];

    function init() {
      metricsDataService.setSortFilters('data-traffic', that.sortFilters, that.defaultFilter);
      that.nodes = metricsDataService.getNodes(that.guid);
      return $q.resolve().then(function () {
        // Enrich nodes information

        var allMetricPromises = [];
        _.each(that.nodes, function (node, key) {

          var metricPromises = [];
          // network Rx
          metricPromises.push(that.metricsModel.getMetrics('network_rx_cumulative',
            that.metricsModel.makeNodeNameFilter(node.spec.metricsNodeName)));
          // network Rx rate
          metricPromises.push(that.metricsModel.getNetworkRxRate(node.spec.metricsNodeName));
          // network Tx
          metricPromises.push(that.metricsModel.getMetrics('network_tx_cumulative',
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

    utilsService.chainStateResolve('cp.metrics.dashboard.data-traffic-summary', $state, init);

  }

  angular.extend(DataTrafficSummaryController.prototype, {});

})();
