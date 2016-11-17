(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.tiles', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('clusters.tiles', {
      url: '/endpoints',
      templateUrl: 'app/view/endpoints/clusters/tiles/cluster-tiles.html',
      controller: ClusterTilesController,
      controllerAs: 'clustersCtrl',
      ncyBreadcrumb: {
        label: gettext('Helion Cloud Foundry Endpoints')
      }
    });
  }

  ClusterTilesController.$inject = [];

  function ClusterTilesController() {}

  angular.extend(ClusterTilesController.prototype, {});
})();
