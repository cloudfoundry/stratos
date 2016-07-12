(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space.detail', {
      url: '',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/space/detail/cluster-space-detail.html',
      controller: ClusterSpaceController,
      controllerAs: 'clusterSpaceController'
    });
  }

  ClusterSpaceController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterSpaceController(modelManager, $stateParams) {
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');

    this.spaceActions = [
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
  }

  angular.extend(ClusterSpaceController.prototype, {

    space: function () {
      return _.get(this.spaceModel.data, this.clusterGuid + '.spaces.' + this.organizationGuid + '.' + this.spaceGuid);
    }

  });
})();
