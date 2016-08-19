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
    '$stateParams',
    '$state',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function ClusterDetailSpacesController($stateParams, $state, modelManager, utils) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spacesPath = this.organizationModel.fetchOrganizationPath(this.clusterGuid, this.organizationGuid) + '.spaces';

    this.stateInitialised = false;

    function init() {
      that.stateInitialised = true;
    }
    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.cluster.organization.detail.spaces', $state, init);
  }

  angular.extend(ClusterDetailSpacesController.prototype, {
    spaces: function () {
      return _.get(this.organizationModel, this.spacesPath);
    },

    keys: _.keys

  });
})();
