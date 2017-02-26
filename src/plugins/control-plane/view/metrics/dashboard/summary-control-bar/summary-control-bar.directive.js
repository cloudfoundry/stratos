(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('summaryControlBar', summaryControlBar);

  summaryControlBar.$inject = ['app.basePath'];

  function summaryControlBar() {
    return {
      bindToController: {
        summaryName: '@',
        guid: '@',
        groupName: '@'
      },
      controller: SummaryControlBar,
      controllerAs: 'summaryControlBarCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/summary-control-bar/summary-control-bar.html'
    };
  }

  SummaryControlBar.$inject = [
    '$interval',
    '$state',
    '$scope',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function SummaryControlBar($interval, $state, $scope, $q, modelManager, utilsService, metricsDataService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.$state = $state;
    this.$q = $q;
    this.utilsService = utilsService;
    this.showCardLayout = true;
    this.metricsDataService = metricsDataService;

    this.currentFilter =

    this.model = {
      filteredApplications: [],
      unfilteredApplicationCount: 0,
      hasApps: false
    };

    this.filter = {
      cnsiGuid: 'all',
      filters: [],
      text: []

    }


    this.cardData = {
      title: this.node
    };
    function init() {

      that.currentFilter = metricsDataService.getCurrentSortFilter(that.groupName);
      that.filters = metricsDataService.getSortFilters(that.groupName);
      return $q.resolve();
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary', $state, init);
  }

  angular.extend(SummaryControlBar.prototype, {

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

    yTickFormatter: function (d, utilsService) {
      return utilsService.mbToHumanSize(parseInt(d) / (1024 * 1024)).replace('GB', '');
    },

    namespaceDetails: function () {
      this.$state.go('metrics.dashboard.namespace.details', {node: this.node});
    },

    // New stuff
    setText: function () {
      // TODO
      console.log('set text called');
    },
    // New stuff
    resetFilter: function () {
      // TODO
      console.log('resresetFilter text called');
    },

    sort: function(){

      console.log(this.currentFilter)
      this.metricsDataService.set
      // TODO
    },

    switchToListView: function (switchView) {
      if (switchView) {
        this.$state.go('cp.metrics.dashboard.' + this.summaryName + '.list');
        this.showCardLayout = false;
      } else {
        this.$state.go('cp.metrics.dashboard.' +  this.summaryName + '.cards');
        this.showCardLayout = true;
      }
    }
  });

})();
