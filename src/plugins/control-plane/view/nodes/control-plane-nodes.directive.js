(function () {
  'use strict';

  angular
    .module('control-plane.view.tiles')
    .directive('controlPlaneNodes', controlPlaneNodes);

  function controlPlaneNodes() {
    return {
      bindToController: {
        nodes: '=',
        guid: '@'
      },
      controller: ControlPlaneNodesController,
      controllerAs: 'controlPlaneNodesCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/nodes/control-plane-nodes.html'
    };
  }

  ControlPlaneNodesController.$inject = [
    '$interval',
    '$scope',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function ControlPlaneNodesController($interval, $scope, modelManager, utilsService) {

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

    $scope.$on('$destroy', function () {
      $interval.cancel(interval);
    });

    $scope.$watch(function () {
      return that.nodes;
    }, function () {
      updateChart();
    });

  }

  angular.extend(ControlPlaneNodesController.prototype, {});

})();
