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
    '$q'
  ];

  function ClustersController(modelManager, $q) {
    var that = this;
    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.serviceInstances = null;

    $q.all([this.serviceInstanceModel.list(), this.userServiceInstanceModel.list()])
      .then(function() {
        that.serviceInstances = [];
        var filteredInstances = _.filter(that.serviceInstanceModel.serviceInstances, {cnsi_type: 'hcf'});
        _.forEach(filteredInstances, function (serviceInstance) {
          var cloned = JSON.parse(JSON.stringify(serviceInstance));
          cloned.isConnected = that.userServiceInstanceModel.serviceInstances[cloned.guid].valid;
          that.serviceInstances.push(cloned);
        });
      })
      .catch(function() {
        that.serviceInstances = false;
      });
  }

  angular.extend(ClustersController.prototype, {

    connect: function(serviceInstance) {
      // TODO implement HCE authentication
      this.activeServiceInstance = serviceInstance;
      this.credentialsFormOpen = true;
    },

    disconnect: function(serviceInstance) {
      // TODO implement HCE authentication
    },

    register: function(serviceInstance) {
      // TODO remove...
    },

    unregister: function(serviceInstance) {
      // TODO remove...
    }

    // showClusterAddForm: function () {
    //   var that = this;
    //   if (this.isHcf()) {
    //     // TODO(irfan) : HCF is a flyout, both should be detail views
    //     this.clusterAddFlyoutActive = true;
    //   } else {
    //     this.hceRegistration.add();
    //   }
    // },

    // setShowDropdown: function (index) {
    //   var that = this;
    //   if (this.showDropdown[index]) {
    //     this.showDropdown[index] = false;
    //   } else {
    //     _.each(_.keys(this.showDropdown), function (rowIndex) {
    //       that.showDropdown[rowIndex] = false;
    //     });
    //     this.showDropdown[index] = true;
    //   }
    // },
    //
    // isHcf: function () {
    //   return this.serviceType === 'hcf';
    // },

    // hideClusterAddForm: function () {
    //   this.clusterAddFlyoutActive = false;
    // },
    // onConnectCancel: function () {
    //   this.credentialsFormOpen = false;
    // },
    //
    // onConnectSuccess: function () {
    //   this.userServiceInstanceModel.numValid += 1;
    //   this.credentialsFormOpen = false;
    //   this.activeServiceInstance = null;
    // }
  });
})();
