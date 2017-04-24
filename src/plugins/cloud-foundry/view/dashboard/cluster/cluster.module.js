(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster', [
      'cloud-foundry.view.dashboard.cluster.detail',
      'cloud-foundry.view.dashboard.cluster.organization'
    ])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster', {
      url: '/:guid',
      abstract: true,
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/cluster.html',
      controller: ClusterController,
      controllerAs: 'clusterController'
    });
  }

  function ClusterController($stateParams, $log, appUtilsService, $state, $q, appClusterRolesService, modelManager, appUserSelection, cfOrganizationModel) {
    var that = this;
    var appModel = modelManager.retrieve('cloud-foundry.model.application');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    this.initialized = false;
    this.guid = $stateParams.guid;
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');

    appUserSelection.deselectAllUsers(this.guid);

    this.getEndpoint = function () {
      return appUtilsService.getClusterEndpoint(that.userServiceInstanceModel.serviceInstances[that.guid]);
    };

    function init() {

      // Cache all organizations associated with this cluster
      var inDepthParams = {
        'inline-relations-depth': 2,
        'exclude-relations': 'domains,private_domains,space_quota_definitions'
      };
      var orgPromise = cfOrganizationModel.listAllOrganizations(that.guid, inDepthParams).then(function (orgs) {
        var allDetailsP = [];
        _.forEach(orgs, function (org) {
          var orgDetailsP = cfOrganizationModel.getOrganizationDetails(that.guid, org).catch(function () {
            // Swallow errors for individual orgs
            $log.error('Failed to fetch details for org - ' + org.entity.name);
          });
          allDetailsP.push(orgDetailsP);
        });
        return $q.all(allDetailsP).then(function (val) {
          that.organizationNames = cfOrganizationModel.organizationNames[that.guid];
          return val;
        });
      }).catch(function (error) {
        $log.error('Error while listing organizations', error);
      });

      /* eslint-disable no-warning-comments */
      // TODO (TEAMFOUR-780): There's a few places we call this for the core endpoints screens (before we hit a specific
      // clusters page). Need to reduce all these calls to one and watch cache.
      // Cache all user service instance data. Also used by child states to determine cluster name in breadcrumbs
      /* eslint-enable no-warning-comments */
      var servicesPromise = that.userServiceInstanceModel.list();

      // Reset any cache we may be interested in
      delete appModel.appSummary;

      // Initialise AuthModel for CNSI promise
      var authModelPromise = $q.resolve();
      if (!authModel.isInitialized(that.guid)) {
        authModelPromise = authModel.initializeForEndpoint(that.guid, true);
      }

      orgPromise.then(function () {
        // Background load of users list
        appClusterRolesService.listUsers(that.guid, true);
      });

      return $q.all([
        orgPromise,
        servicesPromise,
        authModelPromise])
        .finally(function () {
          that.initialized = true;
        });
    }

    appUtilsService.chainStateResolve('endpoint.clusters.cluster', $state, init);
  }

})();
