(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.spaces', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.detail.spaces', {
      url: '/spaces',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/spaces/cluster-organization-detail-spaces.html',
      controller: ClusterDetailSpacesController,
      controllerAs: 'clusterDetailSpacesController'
    });
  }

  ClusterDetailSpacesController.$inject = [
    '$scope',
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterDetailSpacesController($scope, modelManager, $stateParams) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');

    // $scope.$watch(function () {
    //   return _.get(that.spaceModel, 'data.' + that.clusterGuid + '.spaces');
    // }, function(newVal) {
    //   that.spaces = newVal;
    // });
  }

  angular.extend(ClusterDetailSpacesController.prototype, {

  });
})();
