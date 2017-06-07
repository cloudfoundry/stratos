(function () {
  'use strict';

  angular
    .module('service-manager.view.tiles', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('sm.tiles', {
      url: '/tiles',
      templateUrl: 'plugins/service-manager/view/tiles/service-manager-tiles.html',
      controller: ServiceManagerTilesController,
      controllerAs: 'epCtrl',
      params: {
        // param set by Router module to prevent relisting
        // of servicesInstances and userServiceInstances
        instancesListed: false
      },
      ncyBreadcrumb: {
        label: '{{ OEM_CONFIG.SERVICE_MANAGER }}',
        parent: 'endpoint.dashboard'
      },
      data: {
        activeMenuState: 'sm.list'
      }
    });
  }

  ServiceManagerTilesController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  /**
   * @name ServiceManagerTilesController
   * @constructor
   * @param {object} $q - the angular $q service
   * @param {object} $state - the UI router $state service
   * @param  {$stateParams} $stateParams - UI Router state params
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.utilsService} utils - the utils service
   * @property {object} $q - the angular $q service
   * @property {object} $state - the UI router $state service
   * @property  {$stateParams} $stateParams - UI Router state params
   * @property {app.model.modelManager} modelManager - the Model management service
   * @property {app.utils.utilsService} utils - the utils service
   */
  function ServiceManagerTilesController($q, $state, $stateParams, modelManager, utils) {
    var that = this;
    this.modelManager = modelManager;

    this.$q = $q;
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.serviceInstances = {};
    this.state = '';

    function init() {
      return that.refreshEndpointModel();
    }

    utils.chainStateResolve('sm.tiles', $state, init);

  }

  angular.extend(ServiceManagerTilesController.prototype, {
    /**
     * @memberof service-manager.view.tiles
     * @name createEndpointList
     * @description Create the list of Service Manager Endpoints + determine their connected status
     */
    createEndpointList: function () {
      var that = this;
      this.serviceInstances = {};
      var filteredInstances = _.filter(this.serviceInstanceModel.serviceInstances, {cnsi_type: 'hsm'});
      _.forEach(filteredInstances, function (serviceInstance) {
        var cloned = angular.fromJson(angular.toJson(serviceInstance));
        cloned.isConnected = _.get(that.userServiceInstanceModel.serviceInstances[cloned.guid], 'valid', false);

        if (cloned.isConnected) {
          cloned.hasExpired = false;
          that.serviceInstances[cloned.guid] = cloned;
        }
      });
      this.updateState(false, false);
    },

    /**
     * @memberof service-manager.view.tiles
     * @name refreshEndpointModel
     * @description Update the core model data + create the list of Service Manager Endpoints
     * @returns {promise} refresh endpoints promise
     */
    refreshEndpointModel: function () {
      var that = this;
      this.updateState(true, false);

      var promises = [this.stackatoInfo.getStackatoInfo()];
      if (!that.$stateParams.instancesListed) {
        promises = promises.concat([this.serviceInstanceModel.list(), this.userServiceInstanceModel.list()]);
      }
      return this.$q.all(promises)
        .then(function () {
          that.createEndpointList();
        })
        .catch(function () {
          that.updateState(false, true);
        });
    },

    /**
     * @memberof service-manager.view.tiles
     * @name updateState
     * @description Determine the state of the model
     * @param {boolean} loading true if loading async data
     * @param {boolean} loadError true if the async load of data failed
     */
    updateState: function (loading, loadError) {
      var hasEndpoints = _.get(_.keys(this.serviceInstances), 'length', 0) > 0;
      if (hasEndpoints) {
        this.state = '';
      } else if (loading) {
        this.state = 'loading';
      } else if (loadError) {
        this.state = 'loadError';
      } else {
        this.state = 'noClusters';
      }
    }
  });
})();
