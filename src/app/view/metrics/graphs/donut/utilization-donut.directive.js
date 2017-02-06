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
        nodeName: '@',
        metricLimit: '@'
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

    this.metricData = {};
    this.updateUtilization();

    var interval = $interval(function () {
      that.updateUtilization();
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
        margin: {
          top: 0,
          bottom: 0,
          right: 0,
          left: 0
        },
        pie: {
          startAngle: function (d) {
            if (d.data.idle) {
              return d.startAngle * 0.75 - Math.PI * 0.75;
            }
            return d.startAngle / 2 - Math.PI * 0.75;
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
        duration: 500
      }
    };

    this.chartApi;

    this.data = [
      {
        value: 0.0,
        label: 'UTILIZED',
        color: '#4dc1be'
      },
      {
        value: 1.00,
        label: 'LIMIT',
        color: '#60798D',
        idle: true
      }
    ];

  }

  angular.extend(UtilizationDonutController.prototype, {

    updateUtilization: function () {
      var that = this;

      return this.metricsModel.getMetrics(this.metric, '{' + this.filter + '}')
        .then(function (metricsData) {

          var value = (metricsData.dataPoints[metricsData.dataPoints.length - 1].y * 100);

          that.data = [
            {
              value: value,
              label: 'UTILIZED ' + (value.toFixed(2)) + '%',
              color: '#4dc1be'
            },
            {
              value: (100 - value),
              label: 'LIMIT ' + that.metricLimit,
              color: '#60798D',
              idle: true
            }];

        });
    }

  });

})();
