(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.tiles', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.tiles', {
      url: '',
      templateUrl: 'app/view/endpoints/clusters/tiles/cluster-tiles.html',
      controller: ClusterTilesController,
      controllerAs: 'clustersCtrl',
      ncyBreadcrumb: {
        label: gettext('Cloud Foundry Clusters'),
        parent: function() {
          return 'endpoint.dashboard';
        }
      }
    });
  }

  ClusterTilesController.$inject = [
    'app.model.modelManager',
    '$q',
    'app.view.hcfRegistration',
    'helion.framework.widgets.dialog.confirm'
  ];

  /**
   * @name ClusterTilesController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $q - the angular $q service
   * @param {object} hcfRegistration - hcfRegistration - HCF Registration detail view service
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the confirmation dialog service
   */
  function ClusterTilesController(modelManager, $q, hcfRegistration, confirmDialog) {
    this.$q = $q;
    this.hcfRegistration = hcfRegistration;
    this.confirmDialog = confirmDialog;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.loading = false;

    this.boundUnregister = angular.bind(this, this.unregister);
    this.boundConnect = angular.bind(this, this.connect);
    this.boundDisconnect = angular.bind(this, this.disconnect);

    this.createClusterList();
    this.refreshClusterModel();
  }

  angular.extend(ClusterTilesController.prototype, {

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name refreshClusterList
     * @description Update the core model data + create the cluster list
     */
    refreshClusterModel: function () {
      var that = this;
      this.updateState(true, false);
      this.$q.all([this.serviceInstanceModel.list(), this.userServiceInstanceModel.list()])
        .then(function () {
          that.updateState(false, false);
          that.createClusterList();
        })
        .catch(function () {
          that.updateState(false, true);
        });
    },

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
          var tokenExpiry =
            _.get(that.userServiceInstanceModel.serviceInstances[cloned.guid], 'token_expiry', Number.MAX_VALUE);
          cloned.hasExpired = new Date().getTime() > tokenExpiry * 1000;
        }
        that.serviceInstances[cloned.guid] = cloned;
      });
      this.updateState(false, false);
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name connect
     * @description Connect this cluster using credentials about to be supplied
     * @param {string} cnsiGUID identifier of cluster
     */
    connect: function (cnsiGUID) {
      this.credentialsFormCNSI = cnsiGUID;
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name onConnectCancel
     * @description Handle the cancel from connecting to a cluster
     */
    onConnectCancel: function () {
      this.credentialsFormCNSI = false;
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name onConnectCancel
     * @description Handle the success from connecting to a cluster
     */
    onConnectSuccess: function () {
      this.credentialsFormCNSI = false;
      this.refreshClusterModel();
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name disconnect
     * @description Disconnect this cluster
     * @param {string} cnsiGUID identifier of cluster
     */
    disconnect: function (cnsiGUID) {
      var that = this;
      this.userServiceInstanceModel.disconnect(cnsiGUID).then(function () {
        that.refreshClusterModel();
      });
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name register
     * @description Add a cluster to the console
     */
    register: function () {
      var that = this;
      this.hcfRegistration.add().then(function () {
        that.refreshClusterModel();
      });
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name unregister
     * @description Remove a cluster from the console
     * @param {object} serviceInstance cnsi entry for cluster
     */
    unregister: function (serviceInstance) {
      var that = this;

      this.confirmDialog({
        title: gettext('Unregister Cluster'),
        description: gettext('Are you sure you want to unregister cluster \'' + serviceInstance.name + '\''),
        buttonText: {
          yes: gettext('Unregister'),
          no: gettext('Cancel')
        }
      }).result
        .then(angular.bind(that.serviceInstanceModel, that.serviceInstanceModel.remove, serviceInstance))
        .then(angular.bind(that, that.refreshClusterModel));
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
