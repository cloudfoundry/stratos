(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space', [
      'app.view.endpoints.clusters.cluster.organization.space.detail'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space', {
      url: '/:space',
      abstract: true,
      template: '<ui-view/>'
    });
  }

  ClusterSpaceController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterSpaceController(modelManager, $stateParams) {
    this.guid = $stateParams.guid;
    this.org = $stateParams.org;
    this.space = $stateParams.space;
  }

  angular.extend(ClusterSpaceController.prototype, {});
})();
