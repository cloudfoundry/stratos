(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail')
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space.detail.routes', {
      url: '/routes',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/space/detail/routes/space-routes.html',
      controller: SpaceRoutesController,
      controllerAs: 'spaceRoutesController'
    });
  }

  SpaceRoutesController.$inject = [
    '$stateParams'
  ];

  function SpaceRoutesController($stateParams) {
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;
  }

  angular.extend(SpaceRoutesController.prototype, {

  });
})();
