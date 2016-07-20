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
    '$log',
    'app.utils.utilsService',
    '$state',
    '$q'
  ];

  function ClusterController(modelManager, $stateParams, $log, utils, $state, $q) {
    var that = this;

    this.guid = $stateParams.guid;

    function init() {

      // Cache all organizations associated with this cluster
      that.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
      var orgPromise = that.organizationModel.listAllOrganizations(that.guid, {}).then(function (orgs) {
        var detailsPromises = [];
        _.forEach(orgs, function (org) {
          detailsPromises.push(that.organizationModel.getOrganizationDetails(that.guid, org));
        });
        return $q.all(detailsPromises);
      }).catch(function (error) {
        $log.error('Error while listing organizations', error);
      });

      /* eslint-disable no-warning-comments */
      // TODO (TEAMFOUR-780): There's a few places we call this for the core endpoints screens (before we hit a specific
      // clusters page). Need to reduce all these calls to one and watch cache.
      // Cache all user service instance data. Also used by child states to determine cluster name in breadcrumbs
      /* eslint-enable no-warning-comments */
      that.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      var servicesPromise = that.userServiceInstanceModel.list();

      // Needed to show a Space's list of service instances (requires app name, from app guid, from service binding)
      var serviceBindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
      var serviceBindingPromise = serviceBindingModel.listAllServiceBindings(that.guid);

      // Needed to show the domain part of a route's url (which is not included when listing routes via space)
      // This can either be private or shared, we have to check both.
      var privateDomains = modelManager.retrieve('cloud-foundry.model.private-domain');
      var sharedDomains = modelManager.retrieve('cloud-foundry.model.shared-domain');
      var privateDomainsPromise = privateDomains.listAllPrivateDomains(that.guid);
      var sharedDomainsPromise = sharedDomains.listAllSharedDomains(that.guid);

      // Reset any cache we may be interested in
      var appModel = modelManager.retrieve('cloud-foundry.model.application');
      delete appModel.appSummary;

      return $q.all([orgPromise, servicesPromise, serviceBindingPromise, privateDomainsPromise, sharedDomainsPromise]);
    }

    utils.chainStateResolve($state, init);
  }

  angular.extend(ClusterController.prototype, {});
})();
