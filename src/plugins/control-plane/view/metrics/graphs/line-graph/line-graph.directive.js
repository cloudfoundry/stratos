(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('lineGraph', lineGraph);

  lineGraph.$inject = ['app.basePath'];

  function lineGraph(path) {
    return {
      bindToController: {
        filter: '@',
        metric: '@',
        yLabel: '@',
        nodeName: '@',
        yTickFormatter: '&'
      },
      controller: LineGraphController,
      controllerAs: 'lineGraphCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/graphs/line-graph/line-graph.html'
    };
  }

  LineGraphController.$inject = [
    '$interval',
    '$scope',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function LineGraphController($interval, $scope, modelManager, utilsService) {

    var that = this;

    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.utilsService = utilsService;

    // var interval = $interval(function () {
    //   that.updateUtilization();
    // }, 120000);
    //
    // $scope.$on('$destroy', function () {
    //   $interval.cancel(interval);
    // });
    this.options = {
      chart: {
        type: 'lineChart',
        height: 200,
        noData: 'This is not the chart you are looking for',
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
        // yDomain: [0,100],
        showLegend: false,
        interpolate: 'basis'
      }
    };

    this.updateUtilization();

    this.chartApi = null;

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

  angular.extend(LineGraphController.prototype, {

    updateUtilization: function () {
      var that = this;
      this.options.chart.noData = 'Loading data ...';

      function calculateAverage(dataPoints) {

        var average = _.mean(_.map(dataPoints, 'y'));
        var maxValue = _.max(_.map(dataPoints, 'y')) ;
        var minValue = _.min(_.map(dataPoints, 'y'));

        that.options.chart.yDomain = [minValue * 0.75, maxValue + 1.25];

        var movingAverage = _.map(dataPoints, function (dataPoint) {
          return {
            x: dataPoint.x,
            y: average
          }
        });
        return movingAverage
      }

      return this.metricsModel.getMetrics(this.metric, this.filter)
        .then(function (metricsData) {
          that.data = [
            {
              color: '#60799d',
              values: metricsData.dataPoints,
              key: 'CPU Utilization'
            },
            {
              color: '#60799d',
              values: calculateAverage(metricsData.dataPoints),
              key: 'Average'
            }];
          that.chartApi.refresh();
        }).catch(function () {
          that.options.chart.noData = 'No data available';
          that.data = [];
          if(that.chartApi) {
            that.chartApi.refresh();
          }
        });
    }

  });

})();
