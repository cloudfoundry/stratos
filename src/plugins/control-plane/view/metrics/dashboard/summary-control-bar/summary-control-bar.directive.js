(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('summaryControlBar', summaryControlBar);

  summaryControlBar.$inject = ['app.basePath'];

  function summaryControlBar() {
    return {
      bindToController: {
        node: '@',
        showUtilizationDonut: '='
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
    'app.utils.utilsService'
  ];

  function SummaryControlBar($interval, $state, $scope, $q, modelManager, utilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.$state = $state;
    this.$q = $q;
    this.utilsService = utilsService;
    this.metricsData = {};
    this.memoryLimit = 0;

    this.model = {
      filteredApplications: [],
      unfilteredApplicationCount: 0,
      showCardLayout: true,
      hasApps: false
    }

    this.filter = {
      cnsiGuid: 'all',
      filters: [],
      text: []

    }


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

    yTickFormatter: function (d, utilsService){
      return utilsService.mbToHumanSize(parseInt(d) / (1024 * 1024)).replace('GB', '');
    },

    namespaceDetails: function () {
      this.$state.go('metrics.dashboard.namespace.details', {node: this.node});
    },

    // New stuff
    setText: function(){
      // TODO
      console.log('set text called');
    },
    // New stuff
    resetFilter: function(){
      // TODO
      console.log('resresetFilter text called');
    },

    goToGalleryView: function (showCardLayout) {
      this.model.showCardLayout = showCardLayout;
      return this.$state.go('cf.applications.list.gallery-view');
    }
  });

})();
