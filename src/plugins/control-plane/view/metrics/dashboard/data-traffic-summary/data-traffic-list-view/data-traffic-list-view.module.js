(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.data-traffic-summary.list', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.data-traffic-summary.list', {
      url: '/list',
      params: {
        guid: ''
      },
      controller: DataTrafficListViewController,
      controllerAs: 'dataTrafficListCtl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/data-traffic-summary/data-traffic-list-view/data-traffic-list-view.html'

    });
  }

  DataTrafficListViewController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function DataTrafficListViewController($q, $state, $stateParams, modelManager, utilsService, metricsDataService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    var controlPlaneModel = modelManager.retrieve('control-plane.model');
    this.guid = $stateParams.guid;
    this.$q = $q;
    this.nodes = [];


    this.tableColumns = [
      {name: gettext('Node'), value: 'spec.hostname'},
      {name: gettext('Data Transmitted'), value: 'metrics.dataTxData', noSort: true},
      {name: gettext('Transmission Rate'), value: 'metrics.dataTxRate', descendingFirst: true},
      {name: gettext('Data Received'), value: 'metrics.dataRxData', descendingFirst: true},
      {name: gettext('Receive Rate'), value: 'metrics.dataRxRate', descendingFirst: true}
    ];

    function init() {
      that.nodes = metricsDataService.getNodes(that.guid, true);
      return $q.resolve()
        .then(function () {
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

    utilsService.chainStateResolve('cp.metrics.dashboard.summary.list', $state, init);

  }

  angular.extend(DataTrafficListViewController.prototype, {});

})();
