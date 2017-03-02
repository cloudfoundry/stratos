
(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('memoryCard', memoryCard);

  function memoryCard() {
    return {
      bindToController: {
        node: '@',
        showUtilizationDonut: '=',
        title: '@',
        metricsNodeName: '@'
      },
      controller: MemoryCardController,
      controllerAs: 'memoryCardCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/memory-summary/memory-card/memory-card.html'
    };
  }

  MemoryCardController.$inject = [
    '$state',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function MemoryCardController($state, $q, modelManager, utilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('control-plane.model.metrics');
    this.$state = $state;
    this.utilsService = utilsService;
    this.metricsData = {};
    this.memoryLimit = 0;

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

  angular.extend(MemoryCardController.prototype, {

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
      this.metricsModel.getNodeMemoryLimit(this.metricsNodeName).then(function (memoryLimit) {
        that.memoryLimit = parseFloat(memoryLimit, 10) / (1024 * 1024 * 1024);
      });
    },

    getNodeName: function () {

      if (this.node === '*') {
        return 'all';
      } else {
        return this.node;
      }
    },

    yTickFormatter: function (d, utilsService) {
      return utilsService.mbToHumanSize(parseInt(d, 10) / (1024 * 1024)).replace('GB', '');
    }

  });

})();
