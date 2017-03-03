(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('lineGraph', lineGraph);

  //lineGraph.$inject = ['app.basePath'];

  function lineGraph() {
    return {
      bindToController: {
        series: '=',
        filter: '@',
        metric: '@',
        yLabel: '@',
        nodeName: '@',
        yTickFormatter: '&',
        metricsData: '='
      },
      controller: LineGraphController,
      controllerAs: 'lineGraphCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/graphs/line-graph/line-graph.html'
    };
  }

  LineGraphController.$inject = [
    '$scope',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function LineGraphController($scope, modelManager, utilsService) {

    var that = this;

    this.metricsModel = modelManager.retrieve('control-plane.model.metrics');
    this.utilsService = utilsService;

    $scope.$watchCollection(function () {
      return [that.metricsData, that.chartApi];
    }, function () {
      if (!_.isUndefined(that.metricsData)) {
        if (_.isNull(that.metricsData)) {
          that.options.chart.noData = 'No data available';
          that.data = [];
          if (that.chartApi) {
            that.chartApi.refresh();
          }
        } else {
          that._updateChart();
        }
      }
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
          tickFormat: this.utilsService.timeTickFormatter,
          margin: {
            right: 40
          }
        },
        yAxis: {
          axisLabel: this.yLabel,
          axisLabelDistance: -20,
          showMaxMin: false,
          orient: 'right',
          tickFormat: function (d) {
            return that.yTickFormatter()(d, that.utilsService);
          },
          dispatch: {
            renderEnd: function () {
              var elementName = '#' + that.metric + '_' + that.utilsService.sanitizeString(that.nodeName);
              var selectedElement = d3.select(elementName + ' svg');
              if (selectedElement.length > 0 && selectedElement[0][0]) {
                var width = parseInt(selectedElement.style('width').replace(/px/, ''), 10) - 80;
                var yAxis = d3.select(elementName + ' svg .nv-y');
                yAxis.attr('transform', 'translate(' + width + ',0)');
              }

            }
          }
        },
        showLegend: false,
        interpolate: 'basis'
      }
    };
    this.options.chart.noData = 'Loading data ...';

    this.chartApi = null;

    this.data = [];

  }

  angular.extend(LineGraphController.prototype, {

    _updateChart: function () {

      var that = this;

      function calculateAverage(dataPoints) {

        var average = _.mean(_.map(dataPoints, 'y'));
        var maxValue = _.max(_.map(dataPoints, 'y'));
        var minValue = _.min(_.map(dataPoints, 'y'));

        that.options.chart.yDomain = [minValue * 0.75, maxValue + 1.25];

        return _.map(dataPoints, function (dataPoint) {
          return {
            x: dataPoint.x,
            y: average
          };
        });
      }

      this.data = [
        {
          color: '#60799d',
          values: this.metricsData.dataPoints,
          key: 'CPU Utilization'
        },
        {
          color: '#60799d',
          values: calculateAverage(this.metricsData.dataPoints),
          key: 'Average'
        }];
    }

  });

})();
