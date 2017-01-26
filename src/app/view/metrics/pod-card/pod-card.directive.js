(function () {
  'use strict';

  angular
    .module('app.view.metrics')
    .directive('podCard', podCard);

  podCard.$inject = ['app.basePath'];

  function podCard(path) {
    return {
      bindToController: {
        podDetail: '='
      },
      controller: PodCardController,
      controllerAs: 'podCardCtrl',
      templateUrl: path + 'view/metrics/pod-card/pod-card.html'
    };
  }

  PodCardController.$inject = [
    '$interval',
    '$state',
    '$stateParams',
    '$scope',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function PodCardController($interval, $state, $stateParams, $scope, modelManager, utilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.namespaceName = $stateParams.namespaceName;
    this.podName = this.podDetail.podName;
    this.$state = $state;
    this.cpuUsageTimeSeriesData = [];
    this.memoryUsageTimeSeriesData = [];

    this.cardData = {
      title: this.podName
    };
    // var interval = $interval(function () {
    //   that.updateCpuUsage();
    //   that.updateMemoryUsage();
    // }, 30000);

    //
    // $scope.$on('$destroy', function () {
    //   $interval.cancel(interval);
    // });

    function init() {
      // prefetch cpu-usage and memory data
      that.updateCpuUsage();
      that.updateMemoryUsage();

    }

    utilsService.chainStateResolve('metrics.dashboard', $state, init);
  }

  angular.extend(PodCardController.prototype, {

    getCardData: function () {
      return this.cardData;
    },

    updateCpuUsage: function () {
      var that = this;
      return this.metricsModel.getCpuUsageRate(this.metricsModel.makePodFilter(this.namespaceName, this.podName))
        .then(function (metricsData) {
          that.cpuUsageTimeSeriesData = angular.copy(metricsData.timeSeries);
        });
    },

    updateMemoryUsage: function () {
      var that = this;
      return this.metricsModel.getMemoryUsage(this.metricsModel.makePodFilter(this.namespaceName, this.podName))
        .then(function (metricsData) {
          that.memoryUsageTimeSeriesData = angular.copy(metricsData.timeSeries);
        });
    },

  });

})();
