(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.organization.detail', [
      'cloud-foundry.view.dashboard.cluster.organization.spaces',
      'cloud-foundry.view.dashboard.cluster.organization.users'
    ])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.detail', {
      url: '',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/organization/detail/cluster-organization-detail.html',
      controller: ClusterOrgDetailController,
      controllerAs: 'clusterOrgDetailController',
      abstract: true
    });
  }

  function ClusterOrgDetailController(appUtilsService, cfOrganizationModel, cfTabs, $state, $stateParams, $q) {
    var vm = this;

    vm.clusterGuid = $stateParams.guid;
    vm.organizationGuid = $stateParams.organization;
    vm.organizationNames = [];
    vm.cfTabs = cfTabs;
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
