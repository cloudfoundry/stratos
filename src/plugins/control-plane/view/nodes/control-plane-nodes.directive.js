(function () {
  'use strict';

  angular
    .module('service-manager.view.tiles')
    .directive('controlPlaneNodes', ControlPlaneNodes);

  ControlPlaneNodes.$inject = [];

  function ControlPlaneNodes() {
    return {
      bindToController: {
        nodes: '='
      },
      controller: ControlPlaneNodesController,
      controllerAs: 'controlPlaneNodesCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/nodes/control-plane-nodes.html'
    };
  }

  ControlPlaneNodesController.$inject = [
    '$scope'
  ];

  /**
   * @name ControlPlaneNodesController
   * @constructor
   */
  function ControlPlaneNodesController($scope) {
    var that = this;


    this.labels = {
      ok: 'READY',
      unknown: 'NOT READY',
      critical: 'Unknown',
      total: 'NODES',
      totalOne: 'NODE'
    };

    this.data = {ok: 0, unknown: 0, critical: 0}
    function _getInstances(instanceState) {
      return _.reduce(that.nodes, function (sum, node) {
        return node.spec.status === instanceState ? sum + 1 : sum;
      }, 0);
    }

    $scope.$watch(function () {
      return that.nodes;
    }, function () {
      that.data = {
        ok: _getInstances('Ready'),
        unknown: _getInstances('Not Ready'),
        critical: _getInstances('Unknown')
      };
    });
  }

  angular.extend(ControlPlaneNodesController.prototype, {});

})();
