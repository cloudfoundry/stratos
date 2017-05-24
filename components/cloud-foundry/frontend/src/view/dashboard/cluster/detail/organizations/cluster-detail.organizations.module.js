(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.detail.organizations', [])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail.organizations', {
      url: '/organizations',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/organizations/cluster-detail-organizations.html',
      controller: ClusterOrganizationsController,
      controllerAs: 'clusterOrganizationsController',
      ncyBreadcrumb: {
        label: '{{ clusterController.userServiceInstanceModel.serviceInstances[clusterController.guid].name ||"..." }}',
        parent: function () {
          if (_.has(env.plugins, 'endpointsDashboard')) {
            return 'endpoint.clusters.tiles';
          }
        }
      }
    });
  }

  function ClusterOrganizationsController() {}

})();
