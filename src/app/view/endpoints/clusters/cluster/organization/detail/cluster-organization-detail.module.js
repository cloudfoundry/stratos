(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.detail', [
      'app.view.endpoints.clusters.cluster.organization.spaces',
      'app.view.endpoints.clusters.cluster.organization.users'
    ])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.detail', {
      url: '',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/cluster-organization-detail.html',
      controller: ClusterOrgDetailController,
      controllerAs: 'clusterOrgDetailController',
      abstract: true
    });
  }

  function ClusterOrgDetailController(appUtilsService, cfOrganizationModel, $state, $stateParams, $q) {
    var that = this;
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.cfOrganizationModel = cfOrganizationModel;

    function init() {
      that.organizationNames = that.cfOrganizationModel.organizationNames[that.clusterGuid];
      return $q.resolve();
    }

    // Ensure the parent state is fully initialised before we start our own init
    appUtilsService.chainStateResolve('endpoint.clusters.cluster.organization.detail', $state, init);
  }

  angular.extend(ClusterOrgDetailController.prototype, {
    organization: function () {
      return this.cfOrganizationModel.fetchOrganization(this.clusterGuid, this.organizationGuid);
    }
  });
})();
