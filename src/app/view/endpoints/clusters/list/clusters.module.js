(function() {
  'use strict';

  angular
    .module('app.view.endpoints')
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    console.log('registering');
    $stateProvider.state('endpoints.clusters', {
      url: '/clusters',
      templateUrl: 'app/view/endpoints/clusters/list/clusters.html',
      controller: ClustersController,
      controllerAs: 'clustersCtrl'
    });
  }

  ClustersController.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    '$stateParams',
    'helion.framework.widgets.detailView',
    '$scope',
    'app.view.hceRegistration'

  ];

  function ClustersController(modelManager, apiManager, $stateParams, detailView, $scope, hceRegistration) {

    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceInstanceModel.list();




    // this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    // this.serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
    // this.detailView = detailView;
    // this.serviceType = $stateParams.serviceType;
    // this.currentEndpoints = [];
    // this.serviceInstances = {};
    // this.clusterAddFlyoutActive = false;
    // this.hceRegistration = hceRegistration;
    // this.tokenExpiryMessage = 'Token has expired';
    //
    // this.activeServiceInstance = null;
    // var that = this;
    // this.serviceInstanceModel.list();
    // this.userServiceInstanceModel.list();
    //
    // // FIXME there is got to be a better way than this?
    // this.showDropdown = {};
    // $scope.$watchCollection(function () {
    //   return that.serviceInstanceModel.serviceInstances;
    // }, function (serviceInstances) {
    //   var filteredInstances = _.filter(serviceInstances, {cnsi_type: that.serviceType});
    //   _.forEach(filteredInstances, function (serviceInstance) {
    //     var guid = serviceInstance.guid;
    //     if (angular.isUndefined(that.serviceInstances[guid])) {
    //       that.serviceInstances[guid] = serviceInstance;
    //     } else {
    //       angular.extend(that.serviceInstances[guid], serviceInstance);
    //     }
    //   });
    //
    //
    //   that.currentEndpoints = _.map(that.serviceInstances,
    //     function (c) {
    //       var endpoint = c.api_endpoint;
    //       var isConnected = true;
    //       if (that.isHcf()) {
    //         isConnected = that.serviceInstances[c.guid].valid;
    //       }
    //       return {
    //         name: c.name,
    //         url: endpoint.Scheme + '://' + endpoint.Host,
    //         connected: isConnected,
    //         model: c
    //       };
    //     });
    // });
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
