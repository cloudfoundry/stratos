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

    // Cache space data for this cluster
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    spaceModel.listAllSpaces(this.guid);

    // Needed to show a Space's list of service instances (requires app name, from app guid, from service binding)
    var serviceBindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    serviceBindingModel.listAllServiceBindings(this.guid);

    // Needed to show the domain part of a route's url (which is not included when listing routes via space)
    // This can either be private or shared, we have to check both.
    var privateDomains = modelManager.retrieve('cloud-foundry.model.private-domain');
    var sharedDomains = modelManager.retrieve('cloud-foundry.model.shared-domain');
    privateDomains.listAllPrivateDomains(this.guid);
    sharedDomains.listAllSharedDomains(this.guid);

    // Reset any cache we may be interested in
    var appModel = modelManager.retrieve('cloud-foundry.model.application');
    delete appModel.appSummary;

  }

  angular.extend(ClusterController.prototype, {});
})();
