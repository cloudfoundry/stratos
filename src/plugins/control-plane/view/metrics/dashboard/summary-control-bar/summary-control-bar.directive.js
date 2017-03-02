(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('summaryControlBar', summaryControlBar);

  function summaryControlBar() {
    return {
      bindToController: {
        summaryName: '@',
        guid: '@',
        groupName: '@',
        showCardLayout: '=',
        collection: '=',
        filteredCollection: '=',
        filteredProperties: '='
      },
      controller: SummaryControlBar,
      controllerAs: 'summaryControlBarCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/summary-control-bar/summary-control-bar.html'
    };
  }

  SummaryControlBar.$inject = [
    '$state',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function SummaryControlBar($state, $q, modelManager, utilsService, metricsDataService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('control-plane.model.metrics');
    this.$state = $state;
    this.$q = $q;
    this.utilsService = utilsService;
    this.metricsDataService = metricsDataService;

    that.filters = [];

    this.cardData = {
      title: this.node
    };
    function init() {
      that.currentFilter = metricsDataService.getCurrentSortFilter(that.groupName);
      that.setText();
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
        return 'all';
      } else {
        return this.node;
      }
    },

    yTickFormatter: function (d, utilsService) {
      return utilsService.mbToHumanSize(parseInt(d, 10) / (1024 * 1024)).replace('GB', '');
    },

    namespaceDetails: function () {
      this.$state.go('metrics.dashboard.namespace.details', {node: this.node});
    },

    setText: function () {
      var that = this;
      this.metricsDataService.setCurrentSortFilter(this.groupName, this.currentFilter);
      if (!this.currentFilter.text || this.currentFilter.text.length === 0) {
        this.filteredCollection = [].concat(this.collection || []);
      } else {
        var searchText = that.currentFilter.text.toLowerCase();
        this.filteredCollection = _.filter(this.collection, function (object) {
          var filteredProperties = that.filteredProperties || [];
          for (var i = 0; i < filteredProperties.length; i++) {
            var value = _.get(object, filteredProperties[i]);
            if (_.isNumber(value)) {
              value = value.toString();
            }
            if (_.isString(value) && value.toLowerCase().indexOf(searchText) >= 0) {
              return true;
            }
          }
          return false;
        });
      }
    },

    // New stuff
    resetFilter: function () {
      /* eslint-disable no-warning-comments */
      // TODO
      // console.log('resresetFilter text called');
      /* eslint-enable no-warning-comments */
    },

    sort: function () {
      /* eslint-disable no-warning-comments */
      // TODO
      /* eslint-enable no-warning-comments */
    },

    switchToListView: function (switchView) {
      this.showCardLayout = !switchView;
      if (!this.showCardLayout) {
        // st table won't update it's collection if it's not shown, so force an update when we switch to it
        this.setText();
      }
    }
  });

})
();
