(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('utilizationDonut', utilizationDonut);

  utilizationDonut.$inject = ['app.basePath'];

  function utilizationDonut(path) {
    return {
      bindToController: {
        filter: '@',
        metric: '@',
        yLabel: '@',
        nodeName: '@',
        metricLimit: '@',
        metricUnit: '@',
        noLegend: '@',
        intUnit: '@'
      },
      controller: UtilizationDonutController,
      controllerAs: 'utilizationDonutCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/graphs/donut/utilization-donut.html'
    };
  }

  UtilizationDonutController.$inject = [
    '$interval',
    '$scope',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function UtilizationDonutController($interval, $scope, modelManager, utilsService) {

    var that = this;

    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.utilsService = utilsService;

    this.metricData = {};
    this.updateUtilization();

    // var interval = $interval(function () {
    //   that.updateUtilization();
    // }, 120000);
    //
    // $scope.$on('$destroy', function () {
    //   $interval.cancel(interval);
    // });

    $scope.$watch(function () {
      return that.metricLimit;
    }, function () {
      if (that.chartApi) {
        // Update limit as soon as metric limit is available
        that._updateLegend();
      }
    });

    this.options = {
      chart: {
        type: 'pieChart',
        height: 200,
        donut: true,
        donutRatio: 0.99,
        showLabels: false,
        showLegend: this.noLegend === 'true' ? false : true,

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
            inner: 0.6,
            outer: 0.9
          }, {
            inner: 0.7,
            outer: 0.8
          }
          ],
          color: function (d) {
            return d.color;
          }
        },
        duration: 500
      }
    };
    this.chartApi = null;

    this.data = [
      {
        value: 0.0,
        label: 'UTILIZED',
        color: '#4dc1be',
        idle: false
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


    _updateLegend: function (utilValue, idleValue, utilColor, idleColor) {

      var idleElement = _.find(this.data, {idle: true});
      var valueElement = _.find(this.data, {idle: false});
      var utilizedValue = parseFloat((utilValue || valueElement.value) / 100) * parseInt(this.metricLimit, 10);

      utilizedValue = !this.intUnit ? utilizedValue.toFixed(2) : Math.ceil(utilizedValue);

      this.data = [
        {
          value: utilValue || valueElement.value,
          label: 'UTILIZED ' + utilizedValue + ' ' + this.metricUnit,
          color: utilColor || valueElement.color,
          idle: false
        },
        {
          value: idleValue || idleElement.value,
          label: 'LIMIT ' + this.metricLimit + ' ' + this.metricUnit,
          color: idleColor || idleElement.color,
          idle: true
        }];
    },

    updateUtilization: function () {
      var that = this;

      return this.metricsModel.getMetrics(this.metric, this.filter)
        .then(function (metricsData) {

          var value = metricsData.dataPoints[metricsData.dataPoints.length - 1].y * 100;

          var arcColour = '#2ad2c9';
          var cssClass = 'normal-title';
          if (value > 75) {
            arcColour = '#ffd042';
            cssClass = 'warning-title';

          } else if (value > 90) {
            arcColour = '#ff454f';
            cssClass = 'critical-title';
          }

          var svg = d3.select('#' + that.metric + '_' + that.utilsService.sanitizeString(that.nodeName) + '_dnt');
          var donut = svg.selectAll('g.nv-pie').filter(
            function (d, i) {
              return i === 1;
            });

          // check if title already exists
          var title = donut.select('text#title');
          if (title[0] && title[0][0]) {
            // Change title
            title.text(value.toFixed(2) + '%')
              .attr('class', cssClass);
          } else {
            // Insert title
            donut.insert('text', 'g')
              .text(value.toFixed(2) + '%')
              .attr('class', cssClass)
              .attr('text-anchor', 'middle')
              .attr('id', 'title');
          }

          that._updateLegend(value, 100 - value, arcColour, '#60798D');
        });
    }

  });

})();
