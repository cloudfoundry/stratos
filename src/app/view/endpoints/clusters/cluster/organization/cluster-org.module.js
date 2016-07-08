(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization', [
      'app.view.endpoints.clusters.cluster.organization.space'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization', {
      url: '/:org',
      abstract: true,
      template: '<ui-view/>'
    });
  }

  ClusterOrgController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterOrgController(modelManager, $stateParams) {
    this.guid = $stateParams.guid;
    this.org = $stateParams.org;
  }

  angular.extend(ClusterOrgController.prototype, {});
})();
