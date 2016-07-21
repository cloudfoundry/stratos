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
      controllerAs: 'clusterOrganizationsController',
      ncyBreadcrumb: {
        label: '{{ clusterController.userServiceInstanceModel.serviceInstances[clusterController.guid].name ||"..." }}',
        parent: function () {
          return 'endpoint.clusters.tiles';
        }
      }
    });
  }

  ClusterOrganizationsController.$inject = [];

  function ClusterOrganizationsController() {
  }

})();
