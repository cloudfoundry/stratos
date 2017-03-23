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
      template: '<ui-view/>',
      controller: ClusterOrgController,
      controllerAs: 'clusterOrgController'
    });
  }

  ClusterOrgController.$inject = [
    'modelManager',
    'app.utils.utilsService',
    'organization-model',
    '$stateParams',
    '$state',
    '$q',
    '$log'
  ];

  function ClusterOrgController(modelManager, utils, organizationModel, $stateParams, $state, $q, $log) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.organizationModel = organizationModel;
    this.spacesPath = 'organizations.' + this.clusterGuid + '.' + this.organizationGuid + '.spaces';

    function init() {
      var initPromises = [];

      // Fetch details for every space
      _.forEach(_.get(that.organizationModel, that.spacesPath), function (space) {
        var promiseForDetails = that.spaceModel.getSpaceDetails(that.clusterGuid, space).catch(function () {
          //Swallow errors for individual spaces
          $log.error('Failed to fetch details for space - ' + space.entity.name);
        });
        initPromises.push(promiseForDetails);
      });

      // List all services for the org
      var promiseForServices = that.organizationModel
        .listAllServicesForOrganization(that.clusterGuid, that.organizationGuid)
        .then(function (services) {
          that.organizationModel.cacheOrganizationServices(that.clusterGuid, that.organizationGuid, services);
          return services;
        });

      initPromises.push(promiseForServices);

      return $q.all(initPromises);
    }

    utils.chainStateResolve('endpoint.clusters.cluster.organization', $state, init);
  }

})();
