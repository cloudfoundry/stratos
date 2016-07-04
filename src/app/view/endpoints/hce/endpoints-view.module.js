(function () {
  'use strict';

  angular
    .module('app.view.endpoints.hce', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute ($stateProvider) {
    $stateProvider.state('endpoints.hce', {
      url: '/hce',
      templateUrl: 'app/view/endpoints/hce/endpoints-view.html',
      controller: EndpointsViewController,
      controllerAs: 'endpointsViewCtrl'
    });
  }

  EndpointsViewController.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    '$scope',
    'app.view.hceRegistration'

  ];

  function EndpointsViewController (modelManager, apiManager, $scope, hceRegistration) {


    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.serviceType = 'hce';
    this.currentEndpoints = [];
    this.serviceInstances = {};
    this.hceRegistration = hceRegistration;
    this.tokenExpiryMessage = 'Token has expired';
    // FIXME there is got to be a better way than this?
    this.showDropdown = {};
    this.activeServiceInstance = null;
    var that = this;

    this.serviceInstanceModel.list()
      .then(function () {
        return that.userServiceInstanceModel.list();
      }).then(function () {

      $scope.$watchCollection(function () {
        return that.serviceInstanceModel.serviceInstances;
      }, function (serviceInstances) {
        var filteredInstances = _.filter(serviceInstances, {cnsi_type: that.serviceType});
        _.forEach(filteredInstances, function (serviceInstance) {
          var guid = serviceInstance.guid;
          if (angular.isUndefined(that.serviceInstances[guid])) {
            that.serviceInstances[guid] = serviceInstance;
          } else {
            angular.extend(that.serviceInstances[guid], serviceInstance);
          }
        });

        that.currentEndpoints = _.map(that.serviceInstances,
          function (c) {
            var endpoint = c.api_endpoint;
            var isConnected = true;
            if (that.isHcf()) {
              isConnected = that.userServiceInstanceModel.serviceInstances[c.guid].valid;
            }
            return {
              name: c.name,
              guid: c.guid,
              url: endpoint.Scheme + '://' + endpoint.Host,
              connected: isConnected,
              model: c
            };
          });
      });

      // Set watch on userServiceInstanceModel to update conncetion states
      $scope.$watchCollection(function () {
        return that.userServiceInstanceModel.serviceInstances;
      }, function (serviceInstances) {
        _.each(serviceInstances, function (instance, guid) {
          var endpointIndex = _.findIndex(that.currentEndpoints, {guid: guid});
          if (that.isHcf()) {
            that.currentEndpoints[endpointIndex].connected = instance.valid;
          }
        });
      });
    });
  }

  angular.extend(EndpointsViewController.prototype, {

    connect: function (serviceInstance) {
      // TODO implement HCE authentication
    },

    disconnect: function (serviceInstance) {
      // TODO implement HCE authentication
    },

    unregister: function (serviceInstance) {
      // TODO remove...
    },

    showClusterAddForm: function () {
        this.hceRegistration.add();
    },

    setShowDropdown: function (index) {
      var that = this;
      if (this.showDropdown[index]) {
        this.showDropdown[index] = false;
      } else {
        _.each(_.keys(this.showDropdown), function (rowIndex) {
          that.showDropdown[rowIndex] = false;
        });
        this.showDropdown[index] = true;
      }
    },

    isHcf: function () {
      return this.serviceType === 'hcf';
    },

    onConnectCancel: function () {
      this.credentialsFormOpen = false;
    },

    onConnectSuccess: function () {
      this.userServiceInstanceModel.numValid += 1;
      this.credentialsFormOpen = false;
      this.activeServiceInstance = null;
    },

    /**
     * @function isAdmin
     * @memberOf app.view.endpoints.dashboard
     * @description Is current user an admin?
     * @returns {Boolean}
     */
    isUserAdmin: function () {
      return this.currentUserAccount.isAdmin();
    }
  });
})();
