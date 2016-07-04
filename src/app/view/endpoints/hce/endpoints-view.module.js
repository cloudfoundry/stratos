(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
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

  /**
   * @namespace app.view.endpoints.hce
   * @memberof app.view.endpoints.hce
   * @name EndpointsViewController
   * @description Controller for HCE Endpoints View
   * @constructor
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.api.apiManager} apiManager - the api manager
   * @param {object} $scope - angular $scope
   * @param {app.view.hceRegistration} hceRegistration - HCE Registration detail view service
   */
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

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name connect
     * @description Connect to service
     * @param {object} serviceInstance - Service instance
     */
    connect: function (serviceInstance) {
      // TODO implement HCE authentication
      // Currently only implemented for HCF
        this.activeServiceInstance = serviceInstance;
        this.credentialsFormOpen = true;
    },

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name disconnect
     * @description disconnect from service
     * @param {object} serviceInstance - Service instance
     */
    disconnect: function (serviceInstance) {
      // TODO implement HCE authentication
    },

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name unregister
     * @description unregister service
     * @param {object} serviceInstance - Service instance
     */
    unregister: function (serviceInstance) {
      // TODO remove...
    },

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name showClusterAddForm
     * @description Show cluster add form
     */
    showClusterAddForm: function () {
        this.hceRegistration.add();
    },

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name setShowDropdown
     * @description Private method to control dropdowns
     */
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

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name isHcf
     * @description Check if endpoint view instance is an HCF instance
     * @return {Boolean}
     */
    isHcf: function () {
      return this.serviceType === 'hcf';
    },

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name isHcf
     * @description Check if endpoint view instance is an HCF instance
     * @return {Boolean}
     */
    onConnectCancel: function () {
      this.credentialsFormOpen = false;
    },

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name onConnectSuccess
     * @description dismiss view when connection succeeds
     * @return {Boolean}
     */
    onConnectSuccess: function () {
      this.userServiceInstanceModel.numValid += 1;
      this.credentialsFormOpen = false;
      this.activeServiceInstance = null;
    },

    /**
     * @function isUserAdmin
     * @memberOf app.view.endpoints.hce
     * @description Is current user an admin?
     * @returns {Boolean}
     */
    isUserAdmin: function () {
      return this.currentUserAccount.isAdmin();
    }
  });
})();
