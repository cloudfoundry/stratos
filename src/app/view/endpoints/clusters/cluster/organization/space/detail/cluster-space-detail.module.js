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

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spacePath = 'organizations.' + this.clusterGuid + '.' + this.organizationGuid + '.spaces.' + this.spaceGuid;

    this.spaceActions = [
      {
        name: gettext('Create Organization'),
        disabled: true,
        icon: 'helion-icon-lg helion-icon helion-icon-Tree',
        execute: function () {
        }
      },
      {
        name: gettext('Create Space'),
        disabled: true,
        icon: 'helion-icon-lg helion-icon helion-icon-Tree',
        execute: function () {
        }
      },
      {
        name: gettext('Assign User(s)'),
        disabled: true,
        icon: 'helion-icon-lg helion-icon helion-icon-Add_user',
        execute: function () {
        }
      }
    ];

    // $scope.$watch(function () {
    //   return _.get(that.spaceModel, 'data.' + that.clusterGuid + '.spaces');
    // }, function(newVal) {
    //   that.spaces = newVal;
    // });
  }

  angular.extend(ClusterSpaceController.prototype, {
    space: function () {
      return _.get(this.organizationModel, this.spacePath);
    }

  });
})();
