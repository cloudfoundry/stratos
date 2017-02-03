(function () {
  'use strict';

  angular
    .module('app.view.metrics')
    .directive('utilizationDonut', utilizationDonut);

  utilizationDonut.$inject = ['app.basePath'];

  function utilizationDonut(path) {
    return {
      bindToController: {
        filter: '@',
        metric: '@',
        yLabel: '@',
        nodeName: '@'
      },
      controller: UtilizationDonutController,
      controllerAs: 'utilizationDonutCtrl',
      scope: {},
      templateUrl: path + 'view/metrics/graphs/donut/utilization-donut.html'
    };
  }

  UtilizationDonutController.$inject = [
    '$interval',
    '$state',
    '$scope',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function UtilizationDonutController($interval, $state, $scope, $q, modelManager, utilsService) {

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
        type: 'pieChart',
        height: 200,
        donut: true,
        donutRatio: 0.99,
        showLabels: false,
        x: function (d) {
          return d.label;
        },
        y: function (d) {
          return d.value;
        },
        pie: {
          startAngle: function (d) {
            if (d.data.idle) {
              return d.startAngle *0.75 - Math.PI * 0.75;
            }
            return d.startAngle/ 2 - Math.PI * 0.75;
          },
          endAngle: function (d) {
            if (d.data.idle) {
              return d.endAngle * 0.75 - Math.PI * 0.75;
            } else {
              return d.endAngle * 0.75 - Math.PI * 0.75;
            }
          },
          arcsRadius: [{
            inner: 0.7,
            outer: 1.0
          }, {
            inner: 0.8,
            outer: 0.9
          }

          ],
          color: function (d) {
            return d.color;
          }
        },
        duration: 500,
        legend: {
          margin: {
            top: 5,
            right: 140,
            bottom: 5,
            left: 0
          }
        }
      }
    };

    this.chartApi;

    this.data = [
      {
        value: 0.5,
        label: 'Utilized',
        color:  '#4dc1be'
      },
      {
        value: 0.5,
        label: 'idle',
        color: '#60798D',
        idle: true
      }
    ];

  }

  angular.extend(UtilizationDonutController.prototype, {

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
          //   that.data = [{
          //     color: '#60799d',
          //     values: 60,
          //     key: 'CPU Utilization'
          //   }];
          // that.chartApi.refresh();
        });
    },

  });

})();
