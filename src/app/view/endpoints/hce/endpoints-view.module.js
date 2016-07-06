(function () {
  'use strict';

  angular
    .module('app.view.endpoints.hce', [ ])
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
    'app.view.hceRegistration',
    '$log',
    '$q'
  ];

  /**
   * @namespace app.view.endpoints.hce
   * @memberof app.view.endpoints.hce
   * @name EndpointsViewController
   * @description Controller for HCE Endpoints View
   * @constructor
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.api.apiManager} apiManager - the api manager
   * @param {app.view.hceRegistration} hceRegistration - HCE Registration detail view service
   * @param $log
   * @param $q
   */
  function EndpointsViewController (modelManager, apiManager, hceRegistration, $log, $q) {

    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.serviceType = 'hce';
    this.currentEndpoints = [];
    this.serviceInstances = {};
    this.hceRegistration = hceRegistration;
    this.tokenExpiryMessage = 'Token has expired';
    this.cfModel = modelManager.retrieve('cloud-foundry.model.application');
    this.activeServiceInstance = null;
    this.$log = $log;
    this.$q = $q;

    this._updateCurrentEndpoints();
    var that = this;
    // Initialise action menus
    this.connectedActionMenu = [
      {
        name: 'Disconnect',
        execute: function (endpoint) {
          that.disconnect(endpoint.model);
        }
      }];

    this.disconnectedActionMenu = [
      {
        name: 'Connect',
        execute: function (endpoint) {
          that.connect(endpoint.model);
        }
      }];

    if (this.isUserAdmin()) {

      var unregister = function(endpoint){
         that.unregister(endpoint);
      };
      this.connectedActionMenu.push(
        {name: 'Unregister', execute: unregister}
      );
      this.disconnectedActionMenu.push(
        {name: 'Unregister', execute: unregister}
      );
    }

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
     * @param {object} endpoint - endpoint
     */
    disconnect: function (endpoint) {
      // TODO(irfan) Test once HCE authentication is implemented (TEAMFOUR-721)
      var that = this;
      var userServiceInstance = that.userServiceInstanceModel.serviceInstances[endpoint.guid];
      if (angular.isUndefined(userServiceInstance)) {
        that.$log.warn('Will not be able to disconnect from service! ' +
          'This should work once HCE authentication is implemented!');
        return;
      }
      this.userServiceInstanceModel.disconnect(endpoint.guid)
        .then(function success () {
          delete userServiceInstance.account;
          delete userServiceInstance.token_expiry;
          delete userServiceInstance.valid;
          that.userServiceInstanceModel.numValid -= 1;
          that.cfModel.all();
        }).then(function () {
        return _updateCurrentEndpoints();
      });
    },

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name unregister
     * @description unregister service
     * @param {object} endpoint - Service instance
     */
    unregister: function (endpoint) {
      var that = this;
      this.serviceInstanceModel.remove(endpoint.model)
        .then(function success () {
          return that._updateCurrentEndpoints(true);
        });
    },

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name showClusterAddForm
     * @description Show cluster add form
     */
    showClusterAddForm: function () {
      var that = this;
      this.hceRegistration.add().then(function () {
        return that._updateCurrentEndpoints();
      });
    },

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name isHcf
     * @description Check if endpoint view instance is an HCF instance
     */
    isHcf: function () {
      return this.serviceType === 'hcf';
    },

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name isHcf
     * @description Check if endpoint view instance is an HCF instance
     */
    onConnectCancel: function () {
      this.credentialsFormOpen = false;
    },

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name onConnectSuccess
     * @description dismiss view when connection succeeds
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
    },

    _updateCurrentEndpoints: function (invalidateCurrentInstances) {
      var that = this;
      return this.$q.all([this.serviceInstanceModel.list(), this.userServiceInstanceModel.list()])
        .then(function () {

          if (invalidateCurrentInstances) {
            that.serviceInstances = {};
          }
          var filteredInstances = _.filter(that.serviceInstanceModel.serviceInstances, {cnsi_type: that.serviceType});
          _.forEach(filteredInstances, function (serviceInstance) {
            var guid = serviceInstance.guid;
            if (angular.isUndefined(that.serviceInstances[guid])) {
              that.serviceInstances[guid] = serviceInstance;
            } else {
              angular.extend(that.serviceInstances[guid], serviceInstance);
            }
          });

          that.currentEndpoints = _.map(filteredInstances,
            function (c) {
              var endpoint = c.api_endpoint;
              // FIXME Once HCE auth is implement read connection status from userServiceInstanceModel (TEAMFOUR-721)
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

          // FIXME Setting connection status to false to test connection case
          // if (that.currentEndpoints.length > 0) {
          //   that.currentEndpoints[that.currentEndpoints.length - 1].connected = false;
          // }
        });
    }
  });
})();
