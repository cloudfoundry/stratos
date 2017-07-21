(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.organization.spaces', [])
    .config(registerRoute)
    .run(registerTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.detail.spaces', {
      url: '/spaces',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/organization/detail/spaces/cluster-organization-detail-spaces.html',
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

  function registerTab(cfTabs) {
    cfTabs.orgTabs.push({
      position: 1,
      hide: false,
      uiSref: 'endpoint.clusters.cluster.organization.detail.spaces',
      uiSrefParam: _.noop,
      label: 'cf.org-info.space-tab-title'
    });
  }

  function ClusterDetailSpacesController($q, $stateParams, $state, appUtilsService, cfOrganizationModel) {
    var vm = this;

    vm.spaces = spaces;
    vm.keys = _.keys;

    vm.clusterGuid = $stateParams.guid;
    vm.organizationGuid = $stateParams.organization;

    vm.stateInitialised = false;

    // Ensure the parent state is fully initialised before we start our own init
    appUtilsService.chainStateResolve('endpoint.clusters.cluster.organization.detail.spaces', $state, init);

    function init() {
      vm.stateInitialised = true;
      return $q.resolve();
    }

    function spaces() {
      var org = cfOrganizationModel.fetchOrganization(vm.clusterGuid, vm.organizationGuid) || {};
      return org.spaces;
    }

  }
})();
