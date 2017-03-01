(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('cpuCard', cpuCard);

  cpuCard.$inject = ['app.basePath'];

  function cpuCard() {
    return {
      bindToController: {
        node: '@',
        metricsNodeName: '@',
        showUtilizationDonut: '=',
        title: '@',
        cpuLimit: '@'
      },
      controller: CpuCardController,
      controllerAs: 'cpuCardCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/cpu-summary/cpu-card/cpu-card.html'
    };
  }

  CpuCardController.$inject = [
    '$interval',
    '$state',
    '$scope',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'

  ];

  function CpuCardController($interval, $state, $scope, $q, modelManager, utilsService, metricsDataService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.$state = $state;
    this.$q = $q;
    this.utilsService = utilsService;
    this.metricsData = {};
    this.cpuLimit = 0;

    this.cardData = {
      title: this.title
    };


    function init() {
      if (that.showUtilizationDonut) {
        return that.fetchLimitMetrics();
      } else {
        return $q.resolve;
      }
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary', $state, init);
  }

  angular.extend(CpuCardController.prototype, {

    getCardData: function () {
      return this.cardData;
    },

    getNodeFilter: function () {
      return this.metricsModel.makeNodeNameFilter(this.metricsNodeName);
    },

    hasMetrics: function (metricName) {
      return _.has(this.metricsData, metricName) && _.first(this.metricsData[metricName]).dataPoints.length > 0;
    },

    fetchLimitMetrics: function () {
      var that = this;
     },

    getNodeName: function () {

      if (this.node === '*') {
        return 'all';
      } else {
        return this.node;
      }
    },

    yTickFormatter: function (d){
     return d;
    },

    namespaceDetails: function () {
      this.$state.go('metrics.dashboard.namespace.details', {node: this.node});
    }
  });

})();
