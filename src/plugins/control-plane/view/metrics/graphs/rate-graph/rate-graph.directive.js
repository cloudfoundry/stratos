(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('rateGraph', rateGraph);

  function rateGraph() {
    return {
      bindToController: {
        points: '=',
        metricName: '@',
        yLabel: '@',
        nodeName: '@'
      },
      controller: RateChartController,
      controllerAs: 'rateChartCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/graphs/rate-graph/rate-graph.html'
    };
  }

  RateChartController.$inject = [
    '$interval',
    '$scope',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function RateChartController($interval, $scope, modelManager, utilsService, metricsDataService) {

    var that = this;

    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.utilsService = utilsService;
    this.metricsDataService = metricsDataService;

    $scope.$watch(function () {
      return that.points;
    }, function () {

      if (_.isUndefined(that.points)) {
        that.options.chart.noData = 'Loading data ...';
        return;
      }
      if (_.isNull(that.points)) {
        that.options.chart.noData = 'No data available';
        that.data = [];
      } else {
        that.data = [
          {
            values: that.points,
            label: that.yLabel,
            color: '#60798D'
          }
        ];
      }
    });

    this.options = {
      chart: {
        type: 'lineChart',
        height: 200,
        margin: {
          top: 20,
          right: 85,
          bottom: 50,
          left: 20
        },
        color: [
          '#60799d'
        ],
        showLegend: false,
        duration: 300,
        isArea: true,
        useInteractiveGuideline: true,
        clipVoronoi: false,
        y: function (d) {
          return d.y;
        },
        xAxis: {
          axisLabel: '',
          tickFormat: this.utilsService.timeTickFormatter,
          showMaxMin: true,
          staggerLabels: true
        },
        // yDomain:[0,100],
        yAxis: {
          axisLabel: this.yLabel,
          axisLabelDistance: 0,
          orient: 'right',
          showMaxMin: false,
          tickFormat: function (y) {

            var kbData = y / (1024);
            var mbData = y / (1024 * 1024);

            if (kbData > 1000) {
              return mbData.toFixed(1) + ' Mb/s';
            } else {
              return kbData.toFixed(0) + ' Kb/s';
            }
          },
          dispatch: {
            renderEnd: function () {
              var id = '#' + that.metricName + '_' + metricsDataService.getNodeName(that.nodeName) + '_cchart';
              var selectedElement = d3.select(id + ' svg');
              if (selectedElement.length > 0 && selectedElement[0][0]) {
                var width = parseInt(selectedElement.style('width').replace(/px/, ''), 10) - 105;
                var yAxis = d3.select(id + ' svg .nv-y');
                yAxis.attr('transform', 'translate(' + width + ',0)');
              }

            }
          }
        }
      }
    };

    this.chartApi = null;

    this.options.chart.noData = 'Loading data ...';

    this.data = [];

  }

  angular.extend(RateChartController.prototype, {});

})();
