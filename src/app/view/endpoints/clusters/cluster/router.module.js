(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.router', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {

    // Cloud Foundry
    $stateProvider.state('endpoint.clusters.router', {
      url: '',
      template: '<ui-view/>',
      controller: ClustersRouterController,
      controllerAs: 'clustersRouterCtrl',
      ncyBreadcrumb: {
        skip: true
      }
    });
  }

  ClustersRouterController.$inject = [
    '$q',
    '$state',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  /**
   * @name ClustersRouterController
   * @description Redirects the user to either the Organizations Detail page or
   * the Cluster tiles page depending on the number of HCF instances connected.
   * @param {object} $q - the Angular $q service
   * @param {object} $state - the UI router $state service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.utilsService} utils - the utils service
   * @constructor
   */
  function ClustersRouterController($q, $state, modelManager, utils) {
    var that = this;
    this.modelManager = modelManager;

    this.$q = $q;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');

    function init() {

      return that.$q.all([that.serviceInstanceModel.list(), that.userServiceInstanceModel.list()])
        .then(function () {

          var connectedInstances = 0;
          var serviceInstanceGuid;
          var hcfInstances = _.filter(that.serviceInstanceModel.serviceInstances, {cnsi_type: 'hcf'});
          _.forEach(hcfInstances, function (hcfInstance) {
            if (_.get(that.userServiceInstanceModel.serviceInstances[hcfInstance.guid], 'valid', false)) {
              serviceInstanceGuid = hcfInstance.guid;
              connectedInstances += 1;
            }
          });

          if (connectedInstances === 1) {
            $state.go('endpoint.clusters.cluster.detail.organizations', {guid: serviceInstanceGuid});
          } else {
            $state.go('endpoint.clusters.tiles', {instancesListed: true});
          }

        });
    }

    utils.chainStateResolve('endpoint.clusters.router', $state, init);

  }

  angular.extend(ClustersRouterController.prototype, {});

})();
