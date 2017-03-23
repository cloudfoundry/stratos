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
    '$q',
    '$stateParams',
    '$state',
    'app.model.modelManager',
    'app.utils.utilsService',
    'organization-model'
  ];

  function ClusterDetailSpacesController($q, $stateParams, $state, modelManager, utils, organizationModel) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.organizationModel = organizationModel;

    this.stateInitialised = false;

    function init() {
      that.stateInitialised = true;
      return $q.resolve();
    }
    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.cluster.organization.detail.spaces', $state, init);
  }

  angular.extend(ClusterDetailSpacesController.prototype, {
    spaces: function () {
      var org = this.organizationModel.fetchOrganization(this.clusterGuid, this.organizationGuid) || {};
      return org.spaces;
    },

    keys: _.keys

  });
})();
