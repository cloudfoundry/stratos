(function() {
  'use strict';

  angular
    .module('app.view.endpoints')
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoints.clusters', {
      url: '/clusters',
      templateUrl: 'app/view/endpoints/clusters/list/clusters.html',
      controller: ClustersController,
      controllerAs: 'clustersCtrl'
    });
  }

  ClustersController.$inject = [
    'app.model.modelManager',
    '$q',
    'app.view.hcfRegistration',
    'helion.framework.widgets.dialog.confirm'
  ];

  /**
   * @name ClustersController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $q - the angular $q service
   * @param {object} hcfRegistration - hcfRegistration - HCF Registration detail view service
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the confirmation dialog service
   */
  function ClustersController(modelManager, $q, hcfRegistration, confirmDialog) {
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

  angular.extend(ClustersController.prototype, {

    updateClusterList: function() {
      var that = this;

      this.serviceInstances = null;

      this.$q.all([this.serviceInstanceModel.list(), this.userServiceInstanceModel.list()])
        .then(function() {
          that.serviceInstances = [];
          var filteredInstances = _.filter(that.serviceInstanceModel.serviceInstances, {cnsi_type: 'hcf'});
          _.forEach(filteredInstances, function(serviceInstance) {
            var cloned = JSON.parse(JSON.stringify(serviceInstance));
            cloned.isConnected = _.get(that.userServiceInstanceModel.serviceInstances[cloned.guid], 'valid');
            var token_expiry =
              _.get(that.userServiceInstanceModel.serviceInstances[cloned.guid], 'token_expiry', Number.MAX_VALUE);
            cloned.hasExpired = (new Date().getTime()) > token_expiry * 1000;
            that.serviceInstances.push(cloned);
          });
        })
        .catch(function() {
          that.serviceInstances = false;
        });
    },

    connect: function(cnsiGUID) {
      this.credentialsFormCNSI = cnsiGUID;
    },

    onConnectCancel: function() {
      this.credentialsFormCNSI = false;
    },

    onConnectSuccess: function() {
      this.credentialsFormCNSI = false;
      this.updateClusterList();
    },

    disconnect: function(cnsiGUID) {
      var that = this;
      this.userServiceInstanceModel.disconnect(cnsiGUID).then(function() {
        that.updateClusterList();
      });
    },

    register: function() {
      var that = this;
      this.hcfRegistration.add().then(function() {
        that.updateClusterList();
      });
    },

    unregister: function(serviceInstance) {
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
