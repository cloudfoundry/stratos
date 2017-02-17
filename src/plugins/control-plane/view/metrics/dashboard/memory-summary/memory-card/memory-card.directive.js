
(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('memoryCard', memoryCard);

  memoryCard.$inject = ['app.basePath'];

  function memoryCard() {
    return {
      bindToController: {
        node: '@',
        showUtilizationDonut: '='
      },
      controller: MemoryCardController,
      controllerAs: 'memoryCardCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/memory-summary/memory-card/memory-card.html'
    };
  }

  MemoryCardController.$inject = [
    '$interval',
    '$state',
    '$scope',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function MemoryCardController($interval, $state, $scope, $q, modelManager, utilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.$state = $state;
    this.$q = $q;
    this.utilsService = utilsService;
    this.metricsData = {};
    this.memoryLimit = 0;

    // // NOTE: Hack for dev_harness
    // if (this.node === '192.168.200.2') {
    //   this.node = 'kubernetes-master';
    // }
    // if (this.node === '192.168.200.3') {
    //   this.node = 'kubernetes-node';
    // }

    this.cardData = {
      title: this.node
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

  angular.extend(MemoryCardController.prototype, {

    getCardData: function () {
      return this.cardData;
    },

    getNodeFilter: function () {
      return this.metricsModel.makeNodeNameFilter(this.node);
    },

    hasMetrics: function (metricName) {
      return _.has(this.metricsData, metricName) && _.first(this.metricsData[metricName]).dataPoints.length > 0;
    },

    fetchLimitMetrics: function () {
      var that = this;
      this.metricsModel.getNodeMemoryLimit(this.node).then(function (memoryLimit) {
        that.memoryLimit = parseInt(memoryLimit, 10) / (1024 * 1024);
      });
    },

    getNodeName: function () {

      if (this.node === '*') {
        return 'all'
      } else {
        return this.node;
      }
    },

    yTickFormatter: function (d, utilsService){
     return utilsService.mbToHumanSize(parseInt(d) / (1024 * 1024)).replace('GB', '');
    },

    namespaceDetails: function () {
      this.$state.go('metrics.dashboard.namespace.details', {node: this.node});
    }
  });

})();
