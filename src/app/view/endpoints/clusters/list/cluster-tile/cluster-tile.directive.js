(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .directive('clusterTile', ClusterTile);

  ClusterTile.$inject = [];

  function ClusterTile() {
    return {
      bindToController: {
        cluster: '='
      },
      controller: ClusterTileController,
      controllerAs: 'clusterTile',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/list/cluster-tile/cluster-tile.html'
    };
  }

  ClusterTileController.$inject = [
    '$state'
  ];

  function ClusterTileController($state) {
    this.$state = $state;
  }

  angular.extend(ClusterTileController.prototype, {

    summary: function() {
      this.$state.go('endpoints.cluster', { guid: this.cluster.guid });
    }

  });

})();
