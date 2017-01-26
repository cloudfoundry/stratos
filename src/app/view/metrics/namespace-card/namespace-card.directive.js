(function () {
  'use strict';

  angular
    .module('app.view.metrics')
    .directive('namespaceCard', namespaceCard);

  namespaceCard.$inject = ['app.basePath'];

  function namespaceCard(path) {
    return {
      bindToController: {
        namespaceDetail: '='
      },
      controller: NamespaceCardController,
      controllerAs: 'namespaceCardCtrl',
      scope: {},
      templateUrl: path + 'view/metrics/namespace-card/namespace-card.html'
    };
  }

  NamespaceCardController.$inject = [
    '$interval',
    '$state',
    '$scope',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function NamespaceCardController($interval, $state, $scope, $q, modelManager, utilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.namespaceName = this.namespaceDetail.namespaceName;
    this.$state = $state;
    this.cpuUsageTimeSeriesData = [];
    this.memoryUsageTimeSeriesData = [];

    var interval = $interval(function () {
      that.updateCpuUsage();
      that.updateMemoryUsage();
    }, 30000);

    this.cardData = {
      title: this.namespaceName
    };


    $scope.$on('$destroy', function () {
      $interval.cancel(interval);
    });

    function init() {
      // prefetch cpu-usage and memory data
      return $q.all([that.updateCpuUsage(), that.updateMemoryUsage()]);
    }

    utilsService.chainStateResolve('metrics.dashboard', $state, init);
  }

  angular.extend(NamespaceCardController.prototype, {

    getCardData: function () {
      return this.cardData;
    },

    updateCpuUsage: function () {
      var that = this;
      return this.metricsModel.getCpuUsageRate(this.metricsModel.makeNameSpaceFilter(this.namespaceName))
        .then(function (metricsData) {
          that.cpuUsageTimeSeriesData = angular.copy(metricsData.timeSeries);
        });
    },

    updateMemoryUsage: function () {
      var that = this;
      return this.metricsModel.getMemoryUsage(this.metricsModel.makeNameSpaceFilter(this.namespaceName))
        .then(function (metricsData) {
          that.memoryUsageTimeSeriesData = angular.copy(metricsData.timeSeries);
        });
    },

    namespaceDetails: function () {
      this.$state.go('metrics.dashboard.namespace.details', {namespaceName: this.namespaceName});
    }
  });

})();
