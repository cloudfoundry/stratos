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
    var vm = this;

    vm.clusterGuid = $stateParams.guid;
    vm.organizationGuid = $stateParams.organization;
    vm.organizationNames = [];
    vm.organization = organization;

    // Ensure the parent state is fully initialised before we start our own init
    appUtilsService.chainStateResolve('endpoint.clusters.cluster.organization.detail', $state, init);

    function init() {
      vm.organizationNames = cfOrganizationModel.organizationNames[vm.clusterGuid];
      return $q.resolve();
    }

    function organization() {
      return cfOrganizationModel.fetchOrganization(vm.clusterGuid, vm.organizationGuid);
    }
  }
})();
