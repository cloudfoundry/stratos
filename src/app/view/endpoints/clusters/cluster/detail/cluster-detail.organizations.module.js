(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.detail.organizations', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail.organizations', {
      url: '/organizations',
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/cluster-detail-organizations.html',
      controller: ClusterOrganizationsController,
      controllerAs: 'clusterOrganizationsController'
    });
  }

  ClusterOrganizationsController.$inject = [];

  function ClusterOrganizationsController() {
  }

  angular.extend(ClusterOrganizationsController.prototype, {});
})();
