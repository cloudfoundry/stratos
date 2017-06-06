(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.organization', [
      'cloud-foundry.view.dashboard.cluster.organization.space',
      'cloud-foundry.view.dashboard.cluster.organization.detail'
    ])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization', {
      url: '/:organization',
      abstract: true,
      template: '<ui-view/>',
      controller: ClusterOrgController,
      controllerAs: 'clusterOrgController'
    });
  }

  function ClusterOrgController(modelManager, appUtilsService, cfOrganizationModel, $stateParams, $state, $q, $log) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.cfOrganizationModel = cfOrganizationModel;
    this.spacesPath = 'organizations.' + this.clusterGuid + '.' + this.organizationGuid + '.spaces';

    function init() {
      var initPromises = [];

      // Fetch details for every space
      _.forEach(_.get(that.cfOrganizationModel, that.spacesPath), function (space) {
        var promiseForDetails = that.spaceModel.getSpaceDetails(that.clusterGuid, space).catch(function () {
          //Swallow errors for individual spaces
          $log.error('Failed to fetch details for space - ' + space.entity.name);
        });
        initPromises.push(promiseForDetails);
      });

      // List all services for the org
      var promiseForServices = that.cfOrganizationModel
        .listAllServicesForOrganization(that.clusterGuid, that.organizationGuid)
        .then(function (services) {
          that.cfOrganizationModel.cacheOrganizationServices(that.clusterGuid, that.organizationGuid, services);
          return services;
        });

      initPromises.push(promiseForServices);

      return $q.all(initPromises);
    }

    appUtilsService.chainStateResolve('endpoint.clusters.cluster.organization', $state, init);
  }

})();
