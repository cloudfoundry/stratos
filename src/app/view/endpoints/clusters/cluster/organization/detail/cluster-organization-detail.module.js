(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.detail', [
      'app.view.endpoints.clusters.cluster.organization.spaces'
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
      controllerAs: 'clusterOrgDetailController'
    });
  }

  ClusterOrgDetailController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterOrgDetailController(modelManager, $stateParams) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.orgActions = [
      {
        name: gettext('Create Organization'),
        icon: 'helion-icon-lg helion-icon helion-icon-Tree',
        execute: function () {
        }
      },
      {
        name: gettext('Create Space'),
        icon: 'helion-icon-lg helion-icon helion-icon-Tree',
        execute: function () {
        }
      },
      {
        name: gettext('Assign User(s)'),
        icon: 'helion-icon-lg helion-icon helion-icon-Add_user',
        execute: function () {
        }
      }
    ];
    this.organization = null;
    this.spaces = [];

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.organizationModel.listAllOrganizations(this.clusterGuid).then(function (orgs) {
      var org = _.find(orgs, {metadata: {guid: that.organizationGuid}});
      if (!org) {
        return;
      }
      that.organizationModel.getOrganizationDetails(that.clusterGuid, org).then(function(orgDetails) {
        that.organization = orgDetails;
      });
    });
  }

  angular.extend(ClusterOrgDetailController.prototype, {});
})();
