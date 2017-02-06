(function () {
  'use strict';

  angular
    .module('app.view.metrics')
    .directive('sparklineGraph', sparklineGraph);

  sparklineGraph.$inject = ['app.basePath'];

  function sparklineGraph(path) {
    return {
      bindToController: {
        timeseries: '='
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
    },

    polygonPoints: function () {

      /**
       *   const series = this.timeseries.map(({timestamp, value}) => [Date.parse(timestamp), value]);

       const sorted = series.slice().sort((a, b) => a[0] - b[0]);
       const xShift = Math.min(...sorted.map((pt) => pt[0]));
       const shifted = sorted.map(([x, y]) => [x - xShift, y]);
       const xScale = Math.max(...shifted.map((pt) => pt[0])) || 1;
       const yScale = Math.max(...shifted.map((pt) => pt[1])) || 1;
       const scaled = shifted.map(([x, y]) => [x / xScale, y / yScale]);

       // Invert Y because SVG Y=0 is at the top, and we want low values
       // of Y to be closer to the bottom of the graphic
       return scaled.map(([x, y]) => `${x},${(1 - y)}`).join(' ');
       */

        // var series = _.map(this.timeseries, function (timestamp, value) {
        //   return [Date.parse(timestamp), value];
        // });
      // var sortedSeries = this.timeseries.slice().sort(function (a, b) {
      //     return a[0] - b[0];
      //   });

      var xShift = _.min(_.map(this.timeseries, 'timestamp'));

      var shifted = _.map(this.timeseries, function (dataPoint, i) {
        return [dataPoint.timestamp - xShift, dataPoint.value];
      });

      var xScale = _.max(_.map(shifted, function (point) {
          return point[0];
        })) || 1;

      var yScale = _.max(_.map(shifted, function (point) {
          return point[1];
        })) || 1;

      var scaled = _.map(shifted, function (point) {
        return [point[0] / xScale, point[1] / yScale];
      })

      return _.map(scaled, function (point, i) {
        return point[0] + ',' + (1 -  point[1]);
      }).join(' ');

    }

  });

})();
