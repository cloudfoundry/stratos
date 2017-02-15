(function () {
  'use strict';

  angular
    .module('control-plane.view.tiles')
    .directive('cpNodesRingChart', controlPlaneNodes);

  function controlPlaneNodes() {
    return {
      bindToController: {
        nodes: '=',
        guid: '@'
      },
      controller: ControlPlaneNodesController,
      controllerAs: 'controlPlaneNodesCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/graphs/cp-nodes-ring-chart/cp-nodes-ring-chart.html'
    };
  }

  ControlPlaneNodesController.$inject = [
    '$scope',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function ControlPlaneNodesController($scope, modelManager, utilsService) {

    var that = this;

    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.utilsService = utilsService;
    this.data = {
      ok: 0,
      unknown: 0,
      warning: 0
    };

    this.labels = {
      ok: 'Ready',
      unknown: 'Unknown',
      warning: 'Not Ready',
      total: 'Nodes',
      totalOne: 'Node'
    };

    function getCount(label) {
      return _.reduce(that.nodes, function (sum, node) {
        return node.spec.status === label ? sum + 1 : sum;
      }, 0);
    }

    function updateChart() {

      _.each(that.labels, function (label, key) {
        if (key === 'total' || key === 'totalOne') {
          return;
        }
        that.data[key] = getCount(label);
      });
    }


    $scope.$watch(function () {
      return that.nodes;
    }, function () {
      updateChart();
    });

  }

  angular.extend(ControlPlaneNodesController.prototype, {});

})();
