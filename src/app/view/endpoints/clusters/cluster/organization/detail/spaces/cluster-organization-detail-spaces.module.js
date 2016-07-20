(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.spaces', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.detail.spaces', {
      url: '/spaces',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/spaces/cluster-organization-detail-spaces.html',
      controller: ClusterDetailSpacesController,
      controllerAs: 'clusterDetailSpacesController',
      ncyBreadcrumb: {
        label: '{{' +
        'clusterOrgController.organizationModel.organizations[clusterOrgController.clusterGuid][clusterOrgController.organizationGuid].details.org.entity.name || ' +
        '"..." }}',
        parent: function () {
          return 'endpoint.clusters.cluster.detail.organizations';
        }
      }
    });
  }

  ClusterDetailSpacesController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterDetailSpacesController(modelManager, $stateParams) {
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spacesPath = 'organizations.' + this.clusterGuid + '.' + this.organizationGuid + '.spaces';
  }

  angular.extend(ClusterDetailSpacesController.prototype, {
    spaces: function () {
      return _.get(this.organizationModel, this.spacesPath);
    }

  });
})();
