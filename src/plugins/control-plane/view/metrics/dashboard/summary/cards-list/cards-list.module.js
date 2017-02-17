(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.summary.list', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.summary.list', {
      url: '/list',
      params: {
        guid: ''
      },
      controller: CardsListController,
      controllerAs: 'cardsListCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/summary/cards-list/cards-list.html'

    });
  }

  CardsListController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function CardsListController($q, $state, $stateParams, modelManager, utilsService, metricsDataService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    var controlPlaneModel = modelManager.retrieve('control-plane.model');
    this.guid = $stateParams.guid;
    this.$q = $q;
    this.nodes = [];

    this.tableColumns = [
      {name: gettext('Node'), value: 'spec.hostname'},
      {name: gettext('Memory Usage'), value: 'metrics.memory_usage', noSort: true},
      {name: gettext('CPU Usage'), value: 'metrics.cpu_usage', descendingFirst: true},
      {name: gettext('Up Time'), value: 'metrics.upTime', descendingFirst: true},
      {name: gettext('Avail Zone'), value: 'metrics.availabilityZone', descendingFirst: true},
      {name: gettext('Data Transmitted'), value: 'metrics.dataTx', descendingFirst: true},
      {name: gettext('Data Received'), value: 'metrics.dataRx', descendingFirst: true}
    ];

    function init() {

      that.nodes = metricsDataService.getNodes(that.guid, true);

      return $q.resolve()
        .then(function () {
          // Enrich nodes information

          var allMetricPromises = [];
          _.each(that.nodes, function (node, key) {

            var metricPromises = [];
            // cpu
            metricPromises.push(that.metricsModel.getLatestMetricDataPoint('cpu_node_utilization_gauge',
              that.metricsModel.makeNodeNameFilter(node.spec.hostname)));
            // memory_usage
            metricPromises.push(that.metricsModel.getLatestMetricDataPoint('memory_node_utilization_gauge',
              that.metricsModel.makeNodeNameFilter(node.spec.hostname)));
            // uptime
            metricPromises.push(that.metricsModel.getNodeUptime(node.spec.hostname));
            // availabilityZone
            metricPromises.push(that.$q.resolve(node.spec.zone));
            // dataTx
            metricPromises.push(that.metricsModel.getLatestMetricDataPoint('network_tx_rate_gauge',
              that.metricsModel.makeNodeNameFilter(node.spec.hostname)));
            // dataRx
            metricPromises.push(that.metricsModel.getLatestMetricDataPoint('network_rx_rate_gauge',
              that.metricsModel.makeNodeNameFilter(node.spec.hostname)));

            var promises = $q.all(metricPromises)
              .then(function (metrics) {
                // TODO debug
                that.nodes[key].metrics = {};
                that.nodes[key].metrics.cpu_usage = (metrics[0] * 100).toFixed(2);
                that.nodes[key].metrics.memory_usage = (metrics[1] * 100).toFixed(2);
                that.nodes[key].metrics.upTime = metrics[2];
                that.nodes[key].metrics.availabilityZone = metrics[3];
                that.nodes[key].metrics.dataTx = (metrics[4]).toFixed(2);
                that.nodes[key].metrics.dataRx = (metrics[5]).toFixed(2);
              });

            allMetricPromises.push(promises);

          });
          return allMetricPromises;
        });
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary.list', $state, init);

  }

  angular.extend(CardsListController.prototype, {});

})();
