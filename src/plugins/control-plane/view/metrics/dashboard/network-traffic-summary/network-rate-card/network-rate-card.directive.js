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
        title: '@',
        metricsData: '='
      },
      controller: NetworkRateCardController,
      controllerAs: 'networkRateCardCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/network-traffic-summary/network-rate-card/network-rate-card.html'
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

    this.cardData = {
      title: this.title
    };
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

    getLatestPoint: function (metric) {
      if (metric) {
        return this.utilsService.bytesToHumanSize(_.last(metric.dataPoints).y) + '/s';
      }
      return null;

    }

  });

})();
