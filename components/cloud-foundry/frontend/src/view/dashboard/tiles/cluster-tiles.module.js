(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.tiles', [])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.tiles', {
      url: '/list',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/tiles/cluster-tiles.html',
      controller: ClusterTilesController,
      controllerAs: 'clustersCtrl',
      params: {
        // param set by Router module to prevent relisting
        // of servicesInstances and userServiceInstances
        instancesListed: false
      },
      ncyBreadcrumb: {
        label: 'product.cf',
        translate: true,
        parent: function () {
          if (_.has(env.plugins, 'endpointsDashboard')) {
            return 'endpoint.dashboard';
          }
        }
      }
    });
  }

  /**
   * @name ClusterTilesController
   * @constructor
   * @param {object} $q - the angular $q service
   * @param {object} $state - the UI router $state service
   * @param  {$stateParams} $stateParams - UI Router state params
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.appUtilsService} appUtilsService - the appUtilsService service
   * @property {object} $q - the angular $q service
   * @property {object} $state - the UI router $state service
   * @property  {$stateParams} $stateParams - UI Router state params
   * @property {app.model.modelManager} modelManager - the Model management service
   * @property {appUtilsService} appUtilsService - the appUtilsService service
   */
  function ClusterTilesController($q, $state, $stateParams, modelManager, appUtilsService) {
    var vm = this;

    vm.currentUserAccount = modelManager.retrieve('app.model.account');
    vm.serviceInstances = {};
    vm.state = '';
    vm.isEndpointsDashboardAvailable = appUtilsService.isPluginAvailable('endpointsDashboard');

    vm.createClusterList = createClusterList;
    vm.refreshClusterModel = refreshClusterModel;
    vm.updateState = updateState;
    vm.isAdmin = isAdmin;

    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    var consoleInfo = modelManager.retrieve('app.model.consoleInfo');

    appUtilsService.chainStateResolve('endpoint.clusters.tiles', $state, init);

    function init() {
      return refreshClusterModel().then(function () {
        if (_.keys(vm.serviceInstances).length === 1 && !vm.isEndpointsDashboardAvailable) {
          // We are running without the Endpoints Dashboard and there is only one instance available
          // redirecting to Organisations Detail page
          var guid = _.keys(vm.serviceInstances)[0];
          $state.go('endpoint.clusters.cluster.detail.organizations', {guid: guid});
        }
      });
    }

    /**
     * @namespace cloud-foundry.view.dashboard
     * @memberof cloud-foundry.view.dashboard
     * @name createClusterList
     * @description Create the list of clusters + determine their connected status
     */
    function createClusterList() {
      vm.serviceInstances = {};
      var filteredInstances = _.filter(serviceInstanceModel.serviceInstances, {cnsi_type: 'cf'});
      _.forEach(filteredInstances, function (serviceInstance) {
        var cloned = angular.fromJson(angular.toJson(serviceInstance));
        cloned.isConnected = _.get(userServiceInstanceModel.serviceInstances[cloned.guid], 'valid', false);

        if (cloned.isConnected) {
          cloned.hasExpired = false;
          vm.serviceInstances[cloned.guid] = cloned;
        }
      });
      updateState(false, false);
    }

    /**
     * @namespace cloud-foundry.view.dashboard
     * @memberof cloud-foundry.view.dashboard
     * @name refreshClusterList
     * @description Update the core model data + create the cluster list
     * @returns {promise} refresh cluster promise
     */
    function refreshClusterModel() {
      updateState(true, false);

      var promises = [consoleInfo.getConsoleInfo()];
      if (!$stateParams.instancesListed) {
        promises = promises.concat([serviceInstanceModel.list(), userServiceInstanceModel.list()]);
      }
      return $q.all(promises)
        .then(function () {
          vm.createClusterList();
        })
        .catch(function () {
          updateState(false, true);
        });
    }

    /**
     * @namespace cloud-foundry.view.dashboard
     * @memberof cloud-foundry.view.dashboard
     * @name updateState
     * @description Determine the state of the model (contains clusters/doesn't contain clusters/loading/failed to load)
     * @param {boolean} loading true if loading async data
     * @param {boolean} loadError true if the async load of data failed
     */
    function updateState(loading, loadError) {
      var hasClusters = _.get(_.keys(vm.serviceInstances), 'length', 0) > 0;
      if (hasClusters) {
        vm.state = '';
      } else if (loading) {
        vm.state = 'loading';
      } else if (loadError) {
        vm.state = 'loadError';
      } else {
        vm.state = 'noClusters';
      }

    }

    /**
     * @namespace cloud-foundry.view.dashboard
     * @memberof cloud-foundry.view.dashboard
     * @name isAdmin
     * @description check if user is admin, optionally check if endpoints dashboard is loaded
     * @param {boolean} checkForEndpointsDashboard check if Endpoints Dashboard plugin is loaded
     * @returns {*|boolean}
     */
    function isAdmin(checkForEndpointsDashboard) {
      var isAdmin = vm.currentUserAccount.isAdmin();
      if (checkForEndpointsDashboard) {
        isAdmin = isAdmin && vm.isEndpointsDashboardAvailable;
      }
      return isAdmin;
    }
  }
})();
