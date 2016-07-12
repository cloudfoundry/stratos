(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster', [
      'app.view.endpoints.clusters.cluster.detail',
      'app.view.endpoints.clusters.cluster.organization'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster', {
      url: '/:guid',
      abstract: true,
      template: '<ui-view/>',
      controller: ClusterController,
      controllerAs: 'clusterController'
    });
  }

  ClusterController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterController(modelManager, $stateParams) {
    this.guid = $stateParams.guid;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.spaceModel.listAllSpaces(this.guid).then(function () {
      console.log('heeeere');
      //_.get(that.spaceModel, 'data.' + that.clusterGuid + 'spaces');
    });
  }

  angular.extend(ClusterController.prototype, {});
})();
