(function () {
  'use strict';

  angular
    .module('app.view.metrics')
    .directive('averageRateGraph', averageRateGraph);

  averageRateGraph.$inject = ['app.basePath'];

  function averageRateGraph(path) {
    return {
      bindToController: {
        filter: '@',
        metric: '@',
        yLabel: '@',
        nodeName: '@'
      },
      controller: AverageRateGraphController,
      controllerAs: 'averageRateGraphCtrl',
      scope: {},
      templateUrl: path + 'view/metrics/graphs/average-rate-graph.html'
    };
  }

  AverageRateGraphController.$inject = [
    '$interval',
    '$state',
    '$scope',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function AverageRateGraphController($interval, $state, $scope, $q, modelManager, utilsService) {

    var that = this;

    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');

    this.updateCpuUtilization();

    var interval = $interval(function () {
      that.updateCpuUtilization();
    }, 60000);

    $scope.$on('$destroy', function () {
      $interval.cancel(interval);
    });

    this.options = {
      chart: {
        type: 'lineChart',
        height: 200,
        margin: {
          top: 20,
          right: 60,
          bottom: 50,
          left: 20
        },
        useInteractiveGuideline: true,
        dispatch: {},
        xAxis: {
          axisLabel: null,
          tickFormat: function (d) {
            var duration = Math.floor(moment.duration(moment().diff(moment(d * 1000))).asHours());
            if (duration === 0) {
              return 'NOW';
            }
            return duration + 'HR';
          },
          margin: {
            right: 40
          }
        },
        yAxis: {
          axisLabel: this.yLabel,
          axisLabelDistance: -35,
          showMaxMin: false,
          orient: 'right',
          dispatch: {
            renderEnd: function () {
              var width = parseInt(d3.select('#' + that.metric + '_' + that.nodeName + ' svg').style('width').replace(/px/, '')) - 80;
              var yAxis = d3.select('#' + that.metric + '_' + that.nodeName + ' svg .nv-y');
              yAxis.attr('transform', 'translate(' + width + ',0)');
            }
          }
        },
        showLegend: false,
        interpolate: "bundle"
      }
    };

    this.chartApi;

    this.data = [{
      color: '#60799d',
      values: [],
      key: 'CPU Utilization'
    }, {
      color: '#60799d',
      values: [],
      key: 'Average'
    }];


  }

  angular.extend(AverageRateGraphController.prototype, {

    updateCpuUtilization: function () {
      var that = this;


      var movingAverage = [];

      function convertToPercentage(dataPoints) {
        var transformedDp = [];

        var average = 0;
        _.each(dataPoints, function (dataPoint) {
          average += dataPoint.y;
        });
        average = average / dataPoints.length;
        average = (average * 100).toFixed(2);
        _.transform(dataPoints, function (result, dataPoint) {
          result.push(
            {
              x: dataPoint.x,
              y: ((dataPoint.y) * 100).toFixed(2),
            }
          );
          movingAverage.push({
            x: dataPoint.x,
            y: average
          });
          return true;
        }, transformedDp);
        return transformedDp;
      }

      return this.metricsModel.getCpuUtilization('{' + this.filter + '}')
        .then(function (metricsData) {
          that.data = [{
            color: '#60799d',
            values: convertToPercentage(metricsData.dataPoints),
            key: 'CPU Utilization'
          },
            {
              color: '#60799d',
              values: movingAverage,
              key: 'Average'
            }];
          that.chartApi.refresh();
        });
    },

  });

})();
