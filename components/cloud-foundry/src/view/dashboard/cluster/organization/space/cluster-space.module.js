(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.organization.space', [
      'cloud-foundry.view.dashboard.cluster.organization.space.detail'
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
