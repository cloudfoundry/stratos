(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.detail', [
      'app.view.endpoints.clusters.cluster.organization.spaces',
      'app.view.endpoints.clusters.cluster.organization.users'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.detail', {
      url: '',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/cluster-organization-detail.html',
      controller: ClusterOrgDetailController,
      controllerAs: 'clusterOrgDetailController',
      abstract: true
    });
  }

  ClusterOrgDetailController.$inject = [
    'app.model.modelManager',
    '$state',
    '$stateParams',
    '$q',
    'app.utils.utilsService'
  ];

  function ClusterOrgDetailController(modelManager, $state, $stateParams, $q, utils) {
    var that = this;
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.orgPath = this.organizationModel.fetchOrganizationPath(this.clusterGuid, this.organizationGuid);

    function init() {
      that.organizationNames = that.organizationModel.organizationNames[that.clusterGuid];
      return $q.resolve();
    }

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.cluster.organization.detail', $state, init);
  }

  angular.extend(ClusterOrgDetailController.prototype, {
    organization: function () {
      return _.get(this.organizationModel, this.orgPath);
    }
  });
})();
