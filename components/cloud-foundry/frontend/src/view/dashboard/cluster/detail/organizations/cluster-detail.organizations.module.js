(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.detail.organizations', [])
    .config(registerRoute)
    .run(registerTab);

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

  function registerTab(cfTabs) {
    cfTabs.clusterTabs.push({
      position: 1,
      hide: false,
      uiSref: 'endpoint.clusters.cluster.detail.organizations',
      uiSrefParam: _.noop,
      label: 'cf.organisations'
    });
  }

  function ClusterOrganizationsController() {}

})();
