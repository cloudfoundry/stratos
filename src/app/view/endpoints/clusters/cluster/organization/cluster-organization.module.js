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
    'app.model.modelManager',
    '$stateParams',
    '$state',
    'app.utils.utilsService',
    '$q',
    '$log'
  ];

  function ClusterOrgController(modelManager, $stateParams, $state, utils, $q, $log) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spacesPath = 'organizations.' + this.clusterGuid + '.' + this.organizationGuid + '.spaces';

    function init() {
      var promises = [];
      _.forEach(_.get(that.organizationModel, that.spacesPath), function (space) {
        var promise = that.spaceModel.getSpaceDetails(that.clusterGuid, space).catch(function () {
          //Swallow errors for individual spaces
          $log.error('Failed to fetch details for space - ' + space.entity.name);
        });
        promises.push(promise);
      });
      return $q.all(promises);
    }

    utils.chainStateResolve('endpoint.clusters.cluster.organization', $state, init);
  }

})();
