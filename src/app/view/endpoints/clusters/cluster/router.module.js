(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.router', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
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

  function ClustersRouterController($q, $state, modelManager, utils) {
    var that = this;
    this.modelManager = modelManager;

    this.$q = $q;
    this.$state = $state;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');

    function init() {

      return that.refreshClusterModel()
        .then(function () {
          that.createClusterList();
          if (_.keys(that.serviceInstances).length === 1) {
            // that.$state.get('clusters.router.tiles').abstract = true;
            that.$state.go('endpoint.clusters.cluster.detail.organizations', {guid: _.keys(that.serviceInstances)[0]});
          } else {
            that.$state.go('endpoint.clusters.router.tiles');
          }
        });
    }

    utils.chainStateResolve('endpoint.clusters.router', $state, init);

  }

  angular.extend(ClustersRouterController.prototype, {

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name createClusterList
     * @description Create the list of clusters + determine their connected status
     */
    createClusterList: function () {
      var that = this;
      this.serviceInstances = {};
      var filteredInstances = _.filter(this.serviceInstanceModel.serviceInstances, {cnsi_type: 'hcf'});
      _.forEach(filteredInstances, function (serviceInstance) {
        var cloned = angular.fromJson(angular.toJson(serviceInstance));
        cloned.isConnected = _.get(that.userServiceInstanceModel.serviceInstances[cloned.guid], 'valid', false);

        if (cloned.isConnected) {
          cloned.hasExpired = false;
        } else {
          // Skip disconnected HCF
          return;
        }
        that.serviceInstances[cloned.guid] = cloned;
      });
      this.updateState(false, false);
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name refreshClusterList
     * @description Update the core model data + create the cluster list
     * @returns {promise} refresh cluster promise
     */
    refreshClusterModel: function () {
      var that = this;
      this.updateState(true, false);
      return this.$q.all([this.serviceInstanceModel.list(), this.userServiceInstanceModel.list(), this.stackatoInfo.getStackatoInfo()])
        .then(function () {
          that.createClusterList();
        })
        .catch(function () {
          that.updateState(false, true);
        });
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name updateState
     * @description Determine the state of the model (contains clusters/doesn't contain clusters/loading/failed to load)
     * @param {boolean} loading true if loading async data
     * @param {boolean} loadError true if the async load of data failed
     */
    updateState: function (loading, loadError) {
      var hasClusters = _.get(_.keys(this.serviceInstances), 'length', 0) > 0;
      if (hasClusters) {
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
