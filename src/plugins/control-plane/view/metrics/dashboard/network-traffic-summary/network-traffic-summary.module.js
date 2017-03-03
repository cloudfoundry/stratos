(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.network-traffic-summary', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.network-traffic-summary', {
      url: '/network-traffic',
      params: {
        guid: ''
      },
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/network-traffic-summary/network-traffic-summary.html',
      controller: NetworkTrafficController,
      controllerAs: 'networkTrafficCtrl',
      ncyBreadcrumb: {
        label: '{{metricsDashboardCtrl.endpoint.name}}',
        parent: 'cp.tiles'
      }
    });
  }

  NetworkTrafficController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function NetworkTrafficController($q, $state, $stateParams, modelManager, utilsService, metricsDataService) {

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

    this.all = {
      metrics: {}
    };
    if (!_.has(metricsDataService, 'dataTrafficRate.showCardLayout')) {
      this.metricsDataService.dataTrafficRate = {};
      this.metricsDataService.dataTrafficRate.showCardLayout = true;
    }

    this.tableColumns = [
      {name: gettext('Node'), value: 'spec.hostname'},
      {name: gettext('Cumulative Tx Data'), value: 'metrics.txCumulativeValue', descendingFirst: true},
      {name: gettext('Data Tx Rate'), value: 'metrics.txRate.latestDataPoint', noSort: true},
      {name: gettext('Current Tx Rate'), value: 'metrics.txRate.latestDataPointValue', descendingFirst: true},
      {name: gettext('Cumulative Rx Date'), value: 'metrics.rxCumulativeValue', descendingFirst: true},
      {name: gettext('Data Rx Rate'), value: 'metrics.rxRate.latestDataPoint', noSort: true},
      {name: gettext('Current Rx Rate'), value: 'metrics.txRate.latestDataPointValue', descendingFirst: true}
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
          // Rx Cumulative
          metricPromises.push(that.metricsModel.getMetrics('network_rx_cumulative',
            that.metricsModel.makeNodeNameFilter(node.spec.metricsNodeName)));

          // Tx Cumulative
          metricPromises.push(that.metricsModel.getMetrics('network_tx_cumulative',
            that.metricsModel.makeNodeNameFilter(node.spec.metricsNodeName)));

          // Rx Rate
          metricPromises.push(that.metricsModel.getMetrics('network_rx_rate_gauge',
            that.metricsModel.makeNodeNameFilter(node.spec.metricsNodeName)));

          // Tx Rate
          metricPromises.push(that.metricsModel.getMetrics('network_tx_rate_gauge',
            that.metricsModel.makeNodeNameFilter(node.spec.metricsNodeName)));

          var promises = $q.all(metricPromises)
            .then(function (metrics) {
              that.nodes[key].metrics = {};
              that.nodes[key].metrics.rxCumulative = utilsService.bytesToHumanSize(metrics[0].latestDataPoint);
              that.nodes[key].metrics.rxCumulativeValue = metrics[0].latestDataPoint;
              that.nodes[key].metrics.txCumulative = utilsService.bytesToHumanSize(metrics[1].latestDataPoint);
              that.nodes[key].metrics.txCumulativeValue = metrics[1].latestDataPoint;

              that.nodes[key].metrics.rxRate = metrics[2];
              that.nodes[key].metrics.rxRate.latestDataPointValue = metrics[2].latestDataPoint;
              that.nodes[key].metrics.rxRate.latestDataPoint = utilsService.bytesToHumanSize(metrics[2].latestDataPoint) + '/s';
              that.nodes[key].metrics.txRate = metrics[3];
              that.nodes[key].metrics.txRate.latestDataPointValue = metrics[3].latestDataPoint;
              that.nodes[key].metrics.txRate.latestDataPoint = utilsService.bytesToHumanSize(metrics[3].latestDataPoint) + '/s';
            }).catch(function () {
              that.nodes[key].metrics = {};
              that.nodes[key].metrics.rxCumulative = null;
              that.nodes[key].metrics.rxCumulativeValue = null;
              that.nodes[key].metrics.txCumulative = null;
              that.nodes[key].metrics.txCumulativeValue = null;

              that.nodes[key].metrics.rxRate = {};
              that.nodes[key].metrics.rxRate.dataPoints = null;
              that.nodes[key].metrics.rxRate.latestDataPointValue = null;
              that.nodes[key].metrics.rxRate.latestDataPoint = null;
              that.nodes[key].metrics.txRate = {};
              that.nodes[key].metrics.txRate.latestDataPointValue = null;
              that.nodes[key].metrics.txRate.latestDataPoint = null;
              that.nodes[key].metrics.txRate.dataPoints = null;
            });

          allMetricPromises.push(promises);
        });

        // All promises
        var allPromies = [];
        // Rx Cumulative
        allPromies.push(that.metricsModel.getMetrics('network_rx_cumulative',
          that.metricsModel.makeNodeNameFilter('*')));

        // Tx Cumulative
        allPromies.push(that.metricsModel.getMetrics('network_tx_cumulative',
          that.metricsModel.makeNodeNameFilter('*')));

        // Rx Rate
        allPromies.push(that.metricsModel.getMetrics('network_rx_rate_gauge',
          that.metricsModel.makeNodeNameFilter('*')));

        // Tx Rate
        allPromies.push(that.metricsModel.getMetrics('network_tx_rate_gauge',
          that.metricsModel.makeNodeNameFilter('*')));

        var promisesForAll = $q.all(allPromies)
          .then(function (metrics) {
            that.all.metrics.rxCumulative = utilsService.bytesToHumanSize(metrics[0].latestDataPoint);
            that.all.metrics.rxCumulativeValue = metrics[0].latestDataPoint;
            that.all.metrics.txCumulative = utilsService.bytesToHumanSize(metrics[1].latestDataPoint);
            that.all.metrics.txCumulativeValue = metrics[1].latestDataPoint;

            that.all.metrics.rxRate = metrics[2];
            that.all.metrics.rxRate.latestDataPoint = utilsService.bytesToHumanSize(metrics[2].latestDataPoint) + '/s';
            that.all.metrics.txRate = metrics[3];
            that.all.metrics.txRate.latestDataPoint = utilsService.bytesToHumanSize(metrics[3].latestDataPoint) + '/s';
          }).catch(function () {
            that.all.metrics.rxCumulative = null;
            that.all.metrics.rxCumulativeValue = null;
            that.all.metrics.txCumulative = null;
            that.all.metrics.txCumulativeValue = null;

            that.all.metrics.rxRate = {};
            that.all.metrics.rxRate.dataPoints = null;
            that.all.metrics.rxRate.latestDataPoint = null;
            that.all.metrics.txRate = {};
            that.all.metrics.txRate.dataPoints = null;
            that.all.metrics.txRate.latestDataPoint = null;
          });

        allMetricPromises.push(promisesForAll);

        return allMetricPromises;
      });
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.network-traffic-summary', $state, init);

  }

  angular.extend(NetworkTrafficController.prototype, {});

})();
