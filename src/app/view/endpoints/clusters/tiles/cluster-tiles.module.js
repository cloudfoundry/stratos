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
      controllerAs: 'clustersCtrl'
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

    this.boundUnregister = angular.bind(this, this.unregister);
    this.boundConnect = angular.bind(this, this.connect);
    this.boundDisconnect = angular.bind(this, this.disconnect);

    this.updateClusterList();
  }

  angular.extend(ClusterTilesController.prototype, {

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name updateClusterList
     * @description Update the list of clusters + determine their connected status
     */
    updateClusterList: function () {
      var that = this;

      this.serviceInstances = null;
      this.$q.all([this.serviceInstanceModel.list(), this.userServiceInstanceModel.list()])
        .then(function () {
          that.serviceInstances = [];
          var filteredInstances = _.filter(that.serviceInstanceModel.serviceInstances, {cnsi_type: 'hcf'});
          _.forEach(filteredInstances, function (serviceInstance) {
            var cloned = angular.fromJson(angular.toJson(serviceInstance));
            cloned.isConnected = _.get(that.userServiceInstanceModel.serviceInstances[cloned.guid], 'valid', false);

            if (cloned.isConnected) {
              cloned.hasExpired = false;
            } else {
              /* eslint-disable camelcase */
              var token_expiry =
                _.get(that.userServiceInstanceModel.serviceInstances[cloned.guid], 'token_expiry', Number.MAX_VALUE);
              cloned.hasExpired = new Date().getTime() > token_expiry * 1000;
              /* eslint-enable camelcase */
            }
            that.serviceInstances.push(cloned);
          });
        })
        .catch(function () {
          that.serviceInstances = false;
        });
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
      this.updateClusterList();
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
        that.updateClusterList();
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
        that.updateClusterList();
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
        .then(angular.bind(that, that.updateClusterList));
    }

  });
})();
