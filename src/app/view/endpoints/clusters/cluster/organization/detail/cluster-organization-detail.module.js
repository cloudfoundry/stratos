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
      controllerAs: 'clusterOrgDetailController',
      abstract: true
    });
  }

  ClusterOrgDetailController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterOrgDetailController(modelManager, $stateParams) {
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.orgPath = 'organizations.' + this.clusterGuid + '.' + this.organizationGuid;

    this.actions = [
      {
        name: gettext('Create Organization'),
        icon: 'helion-icon-lg helion-icon helion-icon-Tree',
        disabled: true,
        execute: function () {
        }
      },
      {
        name: gettext('Create Space'),
        icon: 'helion-icon-lg helion-icon helion-icon-Tree',
        disabled: true,
        execute: function () {
        }
      },
      {
        name: gettext('Assign User(s)'),
        icon: 'helion-icon-lg helion-icon helion-icon-Add_user',
        disabled: true,
        execute: function () {
        }
      }
    ];
  }

  angular.extend(ClusterOrgDetailController.prototype, {
    organization: function () {
      return _.get(this.organizationModel, this.orgPath);
    }
  });
})();
