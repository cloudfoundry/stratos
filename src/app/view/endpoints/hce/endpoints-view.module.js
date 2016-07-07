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
    'app.view.hceRegistration',
    '$log',
    '$q',
    'helion.framework.widgets.dialog.confirm'
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
   * @param {object} $log - the Angular $log service
   * @param {object} $q - the Angular $q service
   * @param {object} confirmDialog - the confirm dialog service
   */
  function EndpointsViewController (modelManager, apiManager, hceRegistration, $log, $q, confirmDialog) {

    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.serviceType = 'hce';
    this.currentEndpoints = [];
    this.serviceInstances = {};
    this.resolvedUpdateCurrentEndpoints = false;
    if (this.serviceInstanceModel.serviceInstances.length > 0) {
      // serviceInstanceModel has previously been updated
      // to decrease load time, we will use that data.
      this._setCurrentEndpoints();
      this.resolvedUpdateCurrentEndpoints = true;
    }
    this.hceRegistration = hceRegistration;
    this.tokenExpiryMessage = 'Token has expired';
    this.cfModel = modelManager.retrieve('cloud-foundry.model.application');
    this.activeServiceInstance = null;
    this.$log = $log;
    this.$q = $q;
    this.confirmDialog = confirmDialog;

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

      var unregister = function (endpoint) {
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
      // TODO(irfan) Test once HCE authentication is implemented (TEAMFOUR-721)
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
      this.confirmDialog({
        title: gettext('Unregister Endpoint'),
        description: gettext('Are you sure you want to unregister the endpoint \'') + endpoint.name + '\'?',
        buttonText: {
          yes: gettext('Unregister'),
          no: gettext('Cancel')
        },
        callback: function () {
          that.serviceInstanceModel.remove(endpoint.model)
            .then(function success () {
              return that._updateCurrentEndpoints(true);
            });
        }
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

    /**
     * @function showEmptyView
     * @memberOf app.view.endpoints.hce
     * @description Helper to determine if empty view should be shown
     * @returns {boolean}
     */
    showEmptyView: function () {
      if (this.resolvedUpdateCurrentEndpoints && this.currentEndpoints.length === 0) {
        return true;
      }
    },

    /**
     * @function showListView
     * @memberOf app.view.endpoints.hce
     * @description Helper to determine if list view should be shown
     * @returns {boolean}
     */
    showListView: function () {
      if (this.resolvedUpdateCurrentEndpoints && this.currentEndpoints.length > 0) {
        return true;
      }
    },

    /**
     * @function _setCurrentEndpoints
     * @memberOf app.view.endpoints.hce
     * @description Convenience method to set Endpoints
     * @private
     */
    _setCurrentEndpoints: function () {

      var that = this;
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
    },

    /**
     * @function _updateCurrentEndpoints
     * @memberOf app.view.endpoints.hce
     * @param {Boolean} invalidateCurrentInstances empty local serviceInstances
     * only used when removing instances.
     * @returns {*}
     * @private
     */
    _updateCurrentEndpoints: function (invalidateCurrentInstances) {
      var that = this;
      return this.$q.all([this.serviceInstanceModel.list(), this.userServiceInstanceModel.list()])
        .then(function () {

          if (invalidateCurrentInstances) {
            that.serviceInstances = [];
            // Prevent empty view being shown during an update
            that.resolvedUpdateCurrentEndpoint = false;
          }
          that.setCurrentEndpoints();
          // FIXME Setting connection status to false to test connection case
          // if (that.currentEndpoints.length > 0) {
          //   that.currentEndpoints[that.currentEndpoints.length - 1].connected = false;
          // }
        }).then(function () {
          that.resolvedUpdateCurrentEndpoints = true;
        });
    }
  });
})();
