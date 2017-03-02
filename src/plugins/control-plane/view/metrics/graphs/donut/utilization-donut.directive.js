(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('utilizationDonut', utilizationDonut);

  //utilizationDonut.$inject = ['app.basePath'];

  function utilizationDonut() {
    return {
      bindToController: {
        value: '=',
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
    '$scope',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function UtilizationDonutController($scope, modelManager, utilsService) {

    var that = this;

    this.metricsModel = modelManager.retrieve('control-plane.model.metrics');
    this.utilsService = utilsService;
    this.arcColour = '#2ad2c9';

    $scope.$watch(function () {
      return that.value;
    }, function () {
      if (that.value) {
        if (that.value > 75) {
          that.arcColour = '#ffd042';

        } else if (that.value > 90) {
          that.arcColour = '#ff454f';
        }

        that._updateChart(that.value, (100 - that.value), '#60798D');
      }
    });

    this.options = {
      chart: {
        type: 'pieChart',
        height: 200,
        width: 160,
        donut: true,
        donutRatio: 0.99,
        showLabels: false,
        showLegend: this.noLegend !== 'true',
        dispatch: {
          renderEnd: function () {
            that._addTitle();
          }
        },
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

    this.data = [];

  }

  angular.extend(UtilizationDonutController.prototype, {

    _updateChart: function (utilValue, idleValue, idleColor) {

      var idleElement = _.find(this.data, {idle: true});
      var valueElement = _.find(this.data, {idle: false});
      var utilizedValue = parseFloat((utilValue || valueElement.value) / 100) * parseInt(this.metricLimit, 10);

      utilizedValue = !this.intUnit ? utilizedValue.toFixed(2) : Math.ceil(utilizedValue);
      var limit = this.metricLimit;
      if (this.metric === 'memory') {
        utilizedValue = this.utilsService.bytesToHumanSize(utilizedValue);
        limit = this.utilsService.bytesToHumanSize(limit);
      }

      this.data = [
        {
          value: utilValue || valueElement.value,
          label: 'UTILIZED ' + utilizedValue + ' ' + (this.metricUnit || ''),
          color: this.arcColour || valueElement.color,
          idle: false
        },
        {
          value: idleValue || idleElement.value,
          label: 'LIMIT ' + limit + ' ' + (this.metricUnit || ''),
          color: idleColor || idleElement.color,
          idle: true
        }];
    },

    _addTitle: function () {
      var cssClass = 'normal-title';
      if (this.value > 75) {
        this.arcColour = '#ffd042';
        cssClass = 'warning-title';

      } else if (this.value > 90) {
        this.arcColour = '#ff454f';
        cssClass = 'critical-title';
      }

      var svg = d3.select('#' + this.metric + '_' + this.utilsService.sanitizeString(this.nodeName) + '_dnt');
      var donut = svg.selectAll('g.nv-pie').filter(
        function (d, i) {
          return i === 1;
        });

      // check if title already exists
      var title = donut.select('text#title');
      if (title[0] && title[0][0]) {
        // Change title
        title.text(this.value.toFixed(2) + '%')
          .attr('class', cssClass);
      } else {
        // Insert title
        donut.insert('text', 'g')
          .text(this.value.toFixed(2) + '%')
          .attr('class', cssClass)
          .attr('text-anchor', 'middle')
          .attr('id', 'title');
      }
    }
  });

})();
