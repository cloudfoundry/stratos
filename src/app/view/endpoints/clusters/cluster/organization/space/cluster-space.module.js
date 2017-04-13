(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space', [
      'app.view.endpoints.clusters.cluster.organization.space.detail'
    ])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space', {
      url: '/space/:space',
      abstract: true,
      template: '<ui-view/>',
      controller: ClusterSpaceController,
      controllerAs: 'clusterSpaceController'
    });
  }

  function ClusterSpaceController() {}

})();
