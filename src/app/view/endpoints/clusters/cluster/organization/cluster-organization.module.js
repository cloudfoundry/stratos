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
      template: '<ui-view/>'
    });
  }

  ClusterOrgController.$inject = [
  ];

  function ClusterOrgController() {
  }

  angular.extend(ClusterOrgController.prototype, {});
})();
