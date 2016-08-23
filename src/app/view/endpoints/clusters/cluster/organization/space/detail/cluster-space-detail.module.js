(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail', [
      'app.view.endpoints.clusters.cluster.organization.space.detail.services',
      'app.view.endpoints.clusters.cluster.organization.space.detail.routes',
      'app.view.endpoints.clusters.cluster.organization.space.detail.users'
    ])
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
    '$stateParams',
    '$state',
    '$q',
    'app.utils.utilsService'
  ];

  function ClusterSpaceController(modelManager, $stateParams, $state, $q, utils) {
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.spacePath = this.spaceModel.fetchSpacePath(this.clusterGuid, this.spaceGuid);
    var authService = modelManager.retrieve('cloud-foundry.model.auth');

    var that = this;
    function init() {
      // If the user directly navigates to a space with a URL,
      // authService will not be initialised
      if (authService.isInitialized()) {
        return $q.resolve();
      } else {
        return authService.initAuthService(that.clusterGuid);
      }
    }

    utils.chainStateResolve('endpoint.clusters.cluster.organization.space.detail', $state, init);
  }

  angular.extend(ClusterSpaceController.prototype, {
    space: function () {
      return _.get(this.spaceModel, this.spacePath);
    }

  });
})();
