(function () {
  'use strict';

  angular
    .module('app.view.metrics')
    .directive('sparklineGraph', sparklineGraph);

  sparklineGraph.$inject = ['app.basePath'];

  function sparklineGraph(path) {
    return {
      bindToController: {
        filter: '@',
        metric: '@'
      },
      controller: SparklineGraphController,
      controllerAs: 'sparklineGraphCtrl',
      scope: {},
      templateUrl: path + 'view/metrics/graphs/sparklines/sparkline.html'
    };
  }

  SparklineGraphController.$inject = [
    '$interval',
    '$state',
    '$scope',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function SparklineGraphController($interval, $state, $scope, $q, modelManager, utilsService) {

    var that = this;

    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');

    this.updateChart();

    var interval = $interval(function () {
      that.updateChart();
    }, 60000);

    $scope.$on('$destroy', function () {
      $interval.cancel(interval);
    });

    this.options = {
      chart: {
        type: 'sparklinePlus',
        height: 50,
        duration: 250,
        interpolate: 'basis',
        showLastValue: false,
        isArea: true,
        x: function (d, i) {
          return i;
        }
      }
    };

    this.chartApi;

    this.data = [];

  }

  angular.extend(SparklineGraphController.prototype, {

    updateChart: function () {
      var that = this;

      return this.metricsModel.getMetrics(this.metric, '{' + this.filter + '}')
        .then(function (metricsData) {
          that.data = metricsData.dataPoints;
          that.chartApi.refresh();
        });
    }

  });

})();
