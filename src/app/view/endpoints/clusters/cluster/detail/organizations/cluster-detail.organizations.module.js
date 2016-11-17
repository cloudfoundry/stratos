(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.detail.organizations', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('clusters.cluster.detail.organizations', {
      url: '/organizations',
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/organizations/cluster-detail-organizations.html',
      controller: ClusterOrganizationsController,
      controllerAs: 'clusterOrganizationsController',
      ncyBreadcrumb: {
        label: '{{ clusterController.userServiceInstanceModel.serviceInstances[clusterController.guid].name ||"..." }}',
        parent: function () {
          return 'clusters.router.tiles';
        }
      }
    });
  }

  function ClusterOrganizationsController() {}

})();
