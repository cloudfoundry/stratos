(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization', [
      'app.view.endpoints.clusters.cluster.organization.space',
      'app.view.endpoints.clusters.cluster.organization.detail'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization', {
      url: '/:organization',
      abstract: true,
      template: '<ui-view/>',
      controller: ClusterOrgController
    });
  }

  ClusterOrgController.$inject = [
    'app.model.modelManager',
    '$stateParams',
    '$scope'
  ];

  function ClusterOrgController(modelManager, $stateParams, $scope) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spacesPath = 'organizations.' + this.clusterGuid + '.' + this.organizationGuid + '.spaces';

    console.log('GOING TO ORG, FETCHING SPACES');
    $scope.$watch(function () {
      return _.get(that.organizationModel, that.spacesPath);
    }, function (spaces) {
      _.forEach(spaces, function (space) {
        that.spaceModel.getSpaceDetails(that.clusterGuid, space);
      });
    });
  }

  angular.extend(ClusterOrgController.prototype, {});
})();
