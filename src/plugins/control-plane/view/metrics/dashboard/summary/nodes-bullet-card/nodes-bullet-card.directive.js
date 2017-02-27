(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.summary')
    .directive('nodesBulletCard', nodesBulletCard);

  function nodesBulletCard() {
    return {
      bindToController: {
        guid: '@'
      },
      controller: NodesBulletCardController,
      controllerAs: 'nodesBulletCardCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/summary/nodes-bullet-card/nodes-bullet-card.html'
    };
  }

  NodesBulletCardController.$inject = [
    '$interval',
    '$scope',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function NodesBulletCardController($interval, $scope, modelManager, utilsService) {
    var that = this;

    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.utilsService = utilsService;

    this.metricData = {};
    this.updateChart();

    var interval = $interval(function () {
      that.updateChart();
    }, 120000);

    $scope.$on('$destroy', function () {
      $interval.cancel(interval);
    });

    this.options = {
      chart: {
        type: 'bulletChart',
        duration: 500,
        bullet: {
          dispatch: {},
          forceX: [
            0
          ],
          width: 380,
          height: 30,
          tickFormat: null,
          margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
          },
          orient: 'left'
        },
        dispatch: {},
        tooltip: {
          duration: 0,
          gravity: 'w',
          distance: 25,
          snapDistance: 0,
          classes: null,
          chartContainer: null,
          enabled: true,
          hideDelay: 200,
          headerEnabled: false,
          fixedTop: null,
          offset: {
            left: 0,
            top: 0
          },
          hidden: true,
          data: null,
          id: 'nvtooltip-49373'
        },
        forceX: [
          0
        ],
        width: null,
        height: 55,
        tickFormat: null,
        margin: {
          top: 5,
          right: 40,
          bottom: 20,
          left: 120
        },
        orient: 'left',
        ticks: null,
        noData: null
      },
      title: {
        enable: false
      },
      subtitle: {
        enable: false
        },
      caption: {
        enable: false
      },
      styles: {
        classes: {
          'with-3d-shadow': true,
          'with-transitions': true,
          gallery: false
        },
        css: {}
      }
    };

    this.chartApi = null;

    this.data = {
      ranges: [150, 225, 300],
      // "measures": [220],
      // "markers": [250]
    };

  }

  angular.extend(NodesBulletCardController.prototype, {});

})();
