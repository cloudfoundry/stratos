(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.spaces', [])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.detail.spaces', {
      url: '/spaces',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/spaces/cluster-organization-detail-spaces.html',
      controller: ClusterDetailSpacesController,
      controllerAs: 'clusterDetailSpacesController',
      ncyBreadcrumb: {
        label: '{{' +
        'clusterOrgController.cfOrganizationModel.organizations[clusterOrgController.clusterGuid][clusterOrgController.organizationGuid].details.org.entity.name || ' +
        '"..." }}',
        parent: function () {
          return 'endpoint.clusters.cluster.detail.organizations';
        }
      }
    });
  }

  function ClusterDetailSpacesController($q, $stateParams, $state, modelManager, appUtilsService, cfOrganizationModel) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.cfOrganizationModel = cfOrganizationModel;

    this.stateInitialised = false;

    function init() {
      that.stateInitialised = true;
      return $q.resolve();
    }
    // Ensure the parent state is fully initialised before we start our own init
    appUtilsService.chainStateResolve('endpoint.clusters.cluster.organization.detail.spaces', $state, init);
  }

  angular.extend(ClusterDetailSpacesController.prototype, {
    spaces: function () {
      var org = this.cfOrganizationModel.fetchOrganization(this.clusterGuid, this.organizationGuid) || {};
      return org.spaces;
    },

    keys: _.keys

  });
})();
