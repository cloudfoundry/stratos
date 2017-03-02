(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('sparklineGraph', sparklineGraph);

  //sparklineGraph.$inject = ['app.basePath'];

  function sparklineGraph() {
    return {
      bindToController: {
        timeseries: '='
      },
      controller: SparklineGraphController,
      controllerAs: 'sparklineGraphCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/graphs/sparklines/sparkline.html'
    };
  }

  SparklineGraphController.$inject = [
    '$interval',
    '$scope',
    'app.model.modelManager'
  ];

  function SparklineGraphController($interval, $scope, modelManager) {

    //var that = this;

    this.metricsModel = modelManager.retrieve('control-plane.model.metrics');


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

    this.chartApi = null;

    this.data = [];

  }

  angular.extend(SparklineGraphController.prototype, {

    polygonPoints: function () {

      var timeSeries = _.isArray(this.timeseries) ? this.timeseries : this.timeseries.timeSeries;
      var xShift = _.min(_.map(timeSeries, 'timestamp'));

      var shifted = _.map(timeSeries, function (dataPoint) {
        return [dataPoint.timestamp - xShift, dataPoint.value];
      });

      var xScale = _.max(_.map(shifted,
          function (point) {
            return point[0];
          })) || 1;

      var yScale = _.max(_.map(shifted,
          function (point) {
            return point[1];
          })) || 1;

      var scaled = _.map(shifted,
        function (point) {
          return [point[0] / xScale, point[1] / yScale];
        });

      return _.map(scaled,
        function (point) {
          return point[0] + ',' + (1 - point[1]);
        }).join(' ');

    }

  });

})();
