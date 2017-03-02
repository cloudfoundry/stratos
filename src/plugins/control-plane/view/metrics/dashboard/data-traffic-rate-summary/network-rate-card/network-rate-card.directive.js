(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('networkRateCard', networkRateCard);

  networkRateCard.$inject = ['app.basePath'];

  function networkRateCard() {
    return {
      bindToController: {
        node: '@',
        metricsNodeName: '@',
        title: '@'
      },
      controller: NetworkRateCardController,
      controllerAs: 'networkRateCardCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/data-traffic-rate-summary/network-rate-card/network-rate-card.html'
    };
  }

  NetworkRateCardController.$inject = [
    '$state',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function NetworkRateCardController($state, $q, modelManager, utilsService) {

    this.metricsModel = modelManager.retrieve('control-plane.model.metrics');
    this.$state = $state;
    this.$q = $q;
    this.utilsService = utilsService;
    this.cumulativeData = {};

    this.cardData = {
      title: this.title
    };
    this._fetchData();
  }

  angular.extend(NetworkRateCardController.prototype, {

    getCardData: function () {
      return this.cardData;
    },

    getNodeFilter: function () {
      return this.metricsModel.makeNodeNameFilter(this.metricsNodeName);
    },

    hasMetrics: function (metricName) {
      return _.has(this.metricsData, metricName) && _.first(this.metricsData[metricName]).dataPoints.length > 0;
    },

    yTickFormatter: function (d) {
      return d;
    },

    _fetchData: function () {

      var that = this;
      var metricPromises = [];

      // Rx Cumulative
      metricPromises.push(that.metricsModel.getLatestMetricDataPoint('network_rx_cumulative',
        this.metricsModel.makeNodeNameFilter(this.metricsNodeName)));

      // Tx Cumulative
      metricPromises.push(that.metricsModel.getLatestMetricDataPoint('network_tx_cumulative',
        this.metricsModel.makeNodeNameFilter(this.metricsNodeName)));

      // Tx Rate
      metricPromises.push(that.metricsModel.getMetrics('network_rx_rate_gauge',
        this.metricsModel.makeNodeNameFilter(this.metricsNodeName)));

      // Tx Rate
      metricPromises.push(that.metricsModel.getMetrics('network_tx_rate_gauge',
        this.metricsModel.makeNodeNameFilter(this.metricsNodeName)));

      this.$q.all(metricPromises)
        .then(function (metricValues) {
          that.rxCumulative = that.utilsService.bytesToHumanSize(metricValues[0]);
          that.txCumulative = that.utilsService.bytesToHumanSize(metricValues[1]);
          that.rxRate = metricValues[2];
          that.rxRateDataPoints = that.rxRate.dataPoints;
          that.txRate = metricValues[3];
          that.txRateDataPoints = that.txRate.dataPoints;
        })
        .catch(function () {
          // Set these to null to update the charts
          that.rxRateDataPoints = null;
          that.rxRateDataPoints = null;
        });
    },

    getLatestPoint: function (metric) {
      if (metric) {
        return this.utilsService.bytesToHumanSize(_.last(metric.dataPoints).y) + '/s';
      }
      return null;

    }

  });

})();
