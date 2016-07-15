(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster', [
      'app.view.endpoints.clusters.cluster.detail',
      'app.view.endpoints.clusters.cluster.organization',
      'ncy-angular-breadcrumb'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster', {
      url: '/:guid',
      abstract: true,
      templateUrl: 'app/view/endpoints/clusters/cluster/cluster.html',
      controller: ClusterController,
      controllerAs: 'clusterController'
    });
  }

  ClusterController.$inject = [
    'app.model.modelManager',
    '$stateParams',
    '$log'
  ];

  function ClusterController(modelManager, $stateParams, $log) {
    var that = this;

    this.guid = $stateParams.guid;

    // Cache all organizations associated with this cluster
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.organizationModel.listAllOrganizations(this.guid, {}).then(function (orgs) {
      _.forEach(orgs, function (org) {
        that.organizationModel.getOrganizationDetails(that.guid, org);
      });
    }).catch(function (error) {
      $log.error('Error while listing organizations', error);
    });

    /* eslint-disable no-warning-comments */
    // TODO (TEAMFOUR-780): There's a few places we call this for the core endpoints screens (before we hit a specific
    // clusters page). Need to reduce all these calls to one and watch cache.
    // Cache all user service instance data. Also used by child states to determine cluster name in breadcrumbs
    /* eslint-enable no-warning-comments */
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.userServiceInstanceModel.list();

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
