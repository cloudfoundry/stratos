(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization', [
      'app.view.endpoints.clusters.cluster.organization.detail',
      'app.view.endpoints.clusters.cluster.organization.space'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization', {
      url: '/:organization',
      abstract: true,
      template: '<ui-view/>'
    });
  }

  ClusterOrgController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterOrgController(modelManager, $stateParams) {
    console.log('ClusterOrgController: ', $stateParams.organization);
  }

  angular.extend(ClusterOrgController.prototype, {

  });
})();
