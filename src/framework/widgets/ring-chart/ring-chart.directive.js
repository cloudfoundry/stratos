(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('ringChart', ringChart);

  ringChart.$inject = [
    'helion.framework.basePath'
  ];

  /**
   * Note: This widget is derived from the ops Console Ring Chart widge.
   * This has been heavily modified/refactored.
   */

  /**
   * @namespace helion.framework.widgets.ringChart
   * @memberof helion.framework.widgets
   * @name ringChart
   * @description A rint chart  directive that displays a ring chart.
   * @param {string} path - the framework base path
   * @example
   * var labels = { ok: 'Ok', error: 'Error', 'warning: 'Warning', unknown: 'Unknown', total: 'Items', totalOne: 'Item' };
   * var data = { ok: 2, critical: 2, warning: 3, unknown: 4};
   * <ring-chart data="data" labels="labels"></ring-chart>"
   * @returns {object} The ring chart directive definition object
   */
  function ringChart(path) {
    return {
      restrict: 'E',
      bindToController: {
        hideLegend: '=',
        labels: '='
      },
      scope: {
        data: '='
      },
      controller: RingChartController,
      controllerAs: 'rcCtrl',
      templateUrl: path + 'widgets/ring-chart/ring-chart.html'
    };
  }

  RingChartController.$inject = [
    '$scope',
    '$element'
  ];

  /**
   * @namespace helion.framework.widgets.ringChart
   * @memberof helion.framework.widgets
   * @name RingChartController
   * @description Controller for Ring Chart Widget
   * @param {object} $scope - Angular $scope
   * @param {object} $element - Angular $element service
   * @constructor
   */
  function RingChartController($scope, $element) {
    var that = this;

    this.width = $element.find('svg').width();
    this.height = this.width;
    this.derivedData = {
      ok: {},
      warning: {},
      critical: {},
      unknown: {}
    };

    $scope.$watchCollection('data', function (newData) {
      that.data = newData;
      if (that.data) {
        that._updateData();
      }
    });
  }

  angular.extend(RingChartController.prototype, {

    _updateData: function () {
      var that = this;
      var total = _.reduce(this.data, function (total, item) {
        return total + item;
      }, 0);

      this.total = total;

      var lastAngle = 0;
      _.each(this.data, function (count, key) {
        that.handleArc(that.derivedData[key], count, total, lastAngle);
        lastAngle = that.derivedData[key].eAngle;
      });
    },

    hasMetric: function (metric) {
      return this.data && !_.isUndefined(this.data[metric]);
    },

    getPath: function (metric) {
      var donutd = this.derivedData[metric];

      //first we make a tiny non-visible line to help Firefox show the whole graph
      var newD = 'M0 0 L0.0001 0.0001' +
        //start point of arc offset by thickness of largest stroke in graph
        ' M' + (donutd.sPos[0] + donutd.thickness / 2) +
        ' ' + (donutd.sPos[1] + donutd.thickness / 2) +
        //arc radius is a circle of half width/height of the graph
        ' A' + donutd.w / 2 +
        ' ' + donutd.h / 2 +
        //this is always 0 for our purposes
        ' 0' +
        //arcsweep and draw dir determine which circle and which part of that circle to show
        ' ' + donutd.arcSweep +
        ' ' + donutd.drawDir +
        //the end point of the arc offset by largest stroke in graph
        ' ' + (donutd.ePos[0] + donutd.thickness / 2) +
        ' ' + (donutd.ePos[1] + donutd.thickness / 2);
      //set the path d atribute now that we have correctlyu calculated it
      return newD;
    },

    polarToCartesian: function (radius, angleInDegrees, cX, cY) {
      var angleInRadians = (-90 + angleInDegrees) * Math.PI / 180.0;
      var x = cX + radius * Math.cos(angleInRadians);
      var y = cY - radius * -Math.sin(angleInRadians);
      return [x, y];
    },

    handleArc: function (arc, count, sum, sAngle) {
      //start angle
      arc.sAngle = sAngle;
      //the 'length' of the arc in degrees
      /* eslint-disable */
      arc.delta = (count / sum) * 360;
      /* eslint-enable */
      //check if this is going to be a circle or not
      arc.delta = arc.delta >= 360 ? 359.9999 : arc.delta; //limit to juuuuust under a full circle
      //we manually set the largest arc stroke to 18px so all arcs line up to each other
      arc.thickness = 18;
      //we need to know how tall and wide to our draw space is....take into account stroke thickness
      arc.w = this.width - arc.thickness;
      arc.h = this.height - arc.thickness;
      //end angle of the arc
      arc.eAngle = arc.sAngle + arc.delta;
      //find the x,y coords of the start and end angle
      arc.sPos = this.polarToCartesian(arc.w / 2, arc.sAngle, arc.w / 2, arc.h / 2);
      arc.ePos = this.polarToCartesian(arc.w / 2, arc.eAngle, arc.w / 2, arc.h / 2);
      arc.arcSweep = arc.eAngle - arc.sAngle <= 180 ? '0' : '1'; //determine which circle to draw the arc on
      arc.drawDir = arc.sAngle > arc.eAngle ? '0' : '1'; //determine which part of the circle we use
    }
  });

})();
