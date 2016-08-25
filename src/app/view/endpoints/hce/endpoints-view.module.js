(function () {
  'use strict';

  angular
    .module('app.view.endpoints.hce', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.hce', {
      url: '/hce',
      templateUrl: 'app/view/endpoints/hce/endpoints-view.html',
      controller: EndpointsViewController,
      controllerAs: 'endpointsViewCtrl'
    });
  }

  EndpointsViewController.$inject = [
    '$log',
    '$q',
    'app.model.modelManager',
    'app.api.apiManager',
    'app.view.hceRegistration',
    'app.view.notificationsService',
    'helion.framework.widgets.dialog.confirm'
  ];

  /**
   * @namespace app.view.endpoints.hce
   * @memberof app.view.endpoints.hce
   * @name EndpointsViewController
   * @description Controller for HCE Endpoints View
   * @constructor
   * @param {object} $log - the Angular $log service
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.api.apiManager} apiManager - the api manager
   * @param {app.view.hceRegistration} hceRegistration - HCE Registration detail view service
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   * @param {object} confirmDialog - the confirm dialog service
   */
  function EndpointsViewController($log, $q, modelManager, apiManager, hceRegistration, notificationsService,
                                   confirmDialog) {

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
    this.notificationsService = notificationsService;
    this.tokenExpiryMessage = 'Token has expired';
    this.activeServiceInstance = null;
    this.$log = $log;
    this.$q = $q;
    this.confirmDialog = confirmDialog;

    this._updateCurrentEndpoints();
    var that = this;
    // Initialise action menus
    this.connectedActionMenu = [
      {
        name: gettext('Disconnect'),
        execute: function (endpoint) {
          that.disconnect(endpoint.model);
        }
      }];

    this.disconnectedActionMenu = [
      {
        name: gettext('Connect'),
        execute: function (endpoint) {
          that.connect(endpoint.model);
        }
      }];

    this.expiredActionMenu = _.concat(this.disconnectedActionMenu, this.connectedActionMenu);

    if (this.isUserAdmin()) {
      var unregister = function (endpoint) {
        that.unregister(endpoint);
      };
      this.connectedActionMenu.push(
        {name: gettext('Unregister'), execute: unregister}
      );
      this.disconnectedActionMenu.push(
        {name: gettext('Unregister'), execute: unregister}
      );
      this.expiredActionMenu.push(
        {name: gettext('Unregister'), execute: unregister}
      );
    }
  }

  angular.extend(EndpointsViewController.prototype, {

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name getActions
     * @description Get the menu actions appropriate to the given endpoint
     * @param {object} endpoint - Endpoint to return the actions for
     * @returns {object} Array of actions for an action menu appropriate to the given endpoint
     */
    getActions: function (endpoint) {
      if (endpoint.expired) {
        return this.expiredActionMenu;
      } else {
        return endpoint.connected ? this.connectedActionMenu : this.disconnectedActionMenu;
      }
    },

    /**
     * @namespace app.view.endpoints.hce
     * @memberof app.view.endpoints.hce
     * @name connect
     * @description Connect to service
     * @param {object} serviceInstance - Service instance
     */
    connect: function (serviceInstance) {
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
      var that = this;
      var userServiceInstance = that.userServiceInstanceModel.serviceInstances[endpoint.guid];
      this.userServiceInstanceModel.disconnect(endpoint.guid)
        .catch(function (error) {
          that.notificationsService.notify('error', gettext('Failed to disconnect HCE endpoint'), {
            timeOut: 10000
          });
          return $q.reject(error);
        })
        .then(function success() {
          that.notificationsService.notify('success', gettext('HCE endpoint successfully disconnected'));
          delete userServiceInstance.account;
          delete userServiceInstance.token_expiry;
          delete userServiceInstance.valid;
          that.userServiceInstanceModel.numValid -= 1;
        })
        .then(function () {
          return that._updateCurrentEndpoints();
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
        errorMessage: gettext('Failed to unregister endpoint'),
        buttonText: {
          yes: gettext('Unregister'),
          no: gettext('Cancel')
        },
        callback: function () {
          return that.serviceInstanceModel.remove(endpoint.model).then(function success() {
            that.notificationsService.notify('success', gettext('HCE endpoint successfully unregistered'));
            that._updateCurrentEndpoints(true);
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
     * @returns {boolean}
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
      this._updateCurrentEndpoints();
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
          var isConnected = angular.isDefined(that.userServiceInstanceModel.serviceInstances[c.guid]) &&
                            that.userServiceInstanceModel.serviceInstances[c.guid].valid;
          var isExpired = angular.isDefined(that.userServiceInstanceModel.serviceInstances[c.guid]) &&
                            !that.userServiceInstanceModel.serviceInstances[c.guid].valid;
          return {
            name: c.name,
            guid: c.guid,
            url: endpoint.Scheme + '://' + endpoint.Host,
            connected: isConnected,
            expired: isExpired,
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
          that._setCurrentEndpoints();
        }).then(function () {
          that.resolvedUpdateCurrentEndpoints = true;
        });
    }
  });
})();
