(function () {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard')
    .factory('app.view.endpoints.dashboard.cnsiService', cnsiServiceFactory);

  cnsiServiceFactory.$inject = [
    '$q',
    '$state',
    '$interpolate',
    'app.model.modelManager',
    'app.view.endpoints.dashboard.vcsService',
    'app.utils.utilsService',
    'app.error.errorService',
    'app.view.notificationsService',
    'app.view.credentialsDialog',
    'helion.framework.widgets.dialog.confirm'
  ];

  /**
   * @namespace app.view.endpoints.dashboard
   * @memberOf app.view.endpoints.dashboard
   * @name cnsiService
   * @description provide functionality to support cnsi service instances (cnsisi..) in the endpoints dashboard
   * @param {object} $q - the Angular $q service
   * @param {object} $state - the UI router $state service
   * @param {object} $interpolate - the angular $interpolate service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.model.modelManager} vcsService - service to view and manage VCS endpoints in the endpoints dashboard
   * @param {app.utils.utilsService} utilsService - the utils service
   * @param {app.error.errorService} errorService - service to show custom errors below title bar
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   * @param {app.view.credentialsDialog} credentialsDialog - the credentials dialog service
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the confirmation dialog service
   * @returns {object} the service instance service
   */
  function cnsiServiceFactory($q, $state, $interpolate, modelManager, vcsService, utilsService, errorService,
                                         notificationsService, credentialsDialog, confirmDialog) {
    var that = this;
    var endpointPrefix = 'cnsi_';

    return {
      haveInstances: haveInstances,
      updateInstances: updateInstances,
      updateInstancesCache: updateInstancesCache,
      createEndpointEntries: createEndpointEntries,
      clear: clear
    };

    /**
     * @function _updateEndpoints
     * @memberOf app.view.endpoints.dashboard.cnsiService
     * @description are there any cached service instances?
     * @returns {boolean}
     * @public
     */
    function haveInstances() {
      var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
      return serviceInstanceModel.serviceInstances && serviceInstanceModel.serviceInstances.length > 0;
    }

    /**
     * @function _updateEndpoints
     * @memberOf app.view.endpoints.dashboard.cnsiService
     * @description Refresh the cnsi service instances within the model
     * @returns {object} a promise
     * @public
     */
    function updateInstances() {
      var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
      var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      return $q.all([serviceInstanceModel.list(), userServiceInstanceModel.list(), stackatoInfo.getStackatoInfo()])
        .then(function () {

          var errors = _.filter(userServiceInstanceModel.serviceInstances, {error: true});
          errors = _.map(errors, 'name');

          var userServicesCount = Object.keys(userServiceInstanceModel.serviceInstances).length;

          // Ensure the wording of any errors do not use 'connect' to avoid misleading 'connected' stats in tiles.
          // (otherwise we need to add additional 'errored' line to tiles)
          if (!userServicesCount || errors.length === 0) {
            // If there are no services or no errors continue as normal
            errorService.clearAppError();
          } else if (errors.length === 1) {
            var errorMessage = gettext('The Console could not contact the endpoint named "{{name}}". Try reconnecting to this endpoint to resolve this problem.');
            errorService.setAppError($interpolate(errorMessage)({name: errors[0]}));
          } else if (errors.length > 1) {
            errorService.setAppError(gettext('The Console could not contact multiple endpoints.'));
          }

        });
    }

    /**
     * @function updateInstancesCache
     * @memberOf app.view.endpoints.dashboard.cnsiService
     * @description repopulate the endpoints list with the latest data from cache
     * @param {Array} endpoints - collection of existing endpoints
     * @returns {Array} the list of endpoints that still exist (not deleted in the backend)
     * @public
     */
    function updateInstancesCache(endpoints) {
      return createEndpointEntries(endpoints);
    }

    /**
     * @function createEndpointEntries
     * @memberOf app.view.endpoints.dashboard.cnsiService
     * @description convert the model service instances into endpoints entries
     * @param {Array} endpoints - collection of existing endpoints
     * @returns {Array} latest set of service instance endpoint entries
     * @public
     */
    function createEndpointEntries(endpoints) {
      var activeEndpoints = [];
      var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
      var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      // Create the generic 'endpoint' object used to populate the dashboard table
      _.forEach(serviceInstanceModel.serviceInstances, function (serviceInstance) {

        var isValid = _.get(userServiceInstanceModel.serviceInstances[serviceInstance.guid], 'valid', false);
        var hasExpired = false;

        if (!isValid) {
          // If we're not valid but have a token expiry it must have expired
          hasExpired = _.get(userServiceInstanceModel.serviceInstances[serviceInstance.guid], 'token_expiry');
        }

        var eKey = endpointPrefix + serviceInstance.guid;
        var endpoint = _.find(endpoints, function (e) { return e.key === eKey; });
        var reuse = !!endpoint;
        if (!reuse) {
          endpoint = {
            key: eKey,
            type: serviceInstance.cnsi_type === 'hcf' ? gettext('Helion Cloud Foundry') : gettext('Helion Code Engine')
          };
          endpoints.push(endpoint);
        }
        activeEndpoints.push(endpoint.key);

        endpoint.actions = _createInstanceActions(endpoints, isValid, hasExpired);
        endpoint.visit = isValid && serviceInstance.cnsi_type === 'hcf' ? function () {
          return $state.href('endpoint.clusters.cluster.detail.organizations', {guid: serviceInstance.guid});
        } : undefined;
        endpoint.url = utilsService.getClusterEndpoint(serviceInstance);
        endpoint.actionsTarget = serviceInstance;
        endpoint.name = serviceInstance.name;

        endpoint.getStatus = function () {
          if (serviceInstance.error) {
            return 'error';
          }
          if (hasExpired) {
            return 'expired';
          }
          return isValid ? 'connected' : 'unconnected';
        };

        // Error states
        if (serviceInstance.error) {
          // Service could not be contacted
          endpoint.error = {
            message: gettext('The Console could not contact this endpoint. Try reconnecting to this endpoint to resolve this problem.'),
            status: 'error'
          };
        } else if (hasExpired) {
          // Service token has expired
          endpoint.error = {
            message: gettext('Token has expired. Try reconnecting to this endpoint to resolve this problem.'),
            status: 'error'
          };
        }
      });
      return activeEndpoints;
    }

    /**
     * @function clear
     * @memberOf app.view.endpoints.dashboard.cnsiService
     * @description clear any local data before leaving the dashboard
     * @public
     */
    function clear() {
      errorService.clearAppError();
    }

    function _createInstanceActions(endpoints, isConnected, expired) {
      var actions = [];

      if (!isConnected) {
        actions.push({
          name: gettext('Connect'),
          execute: function (serviceInstance) {
            _connect(endpoints, serviceInstance);
          }
        });
      }

      if (isConnected || expired) {
        actions.push({
          name: gettext('Disconnect'),
          execute: function (serviceInstance) {
            _disconnect(endpoints, serviceInstance);
          }
        });
      }

      var currentUserAccount = modelManager.retrieve('app.model.account');
      if (currentUserAccount.isAdmin()) {
        actions.push({
          name: gettext('Unregister'),
          execute: function (serviceInstance) {
            _unregister(endpoints, serviceInstance);
          }
        });
      }
      return actions;
    }

    function _unregister(endpoints, serviceInstance) {
      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      confirmDialog({
        title: gettext('Unregister Endpoint'),
        description: $interpolate(gettext('Are you sure you want to unregister endpoint \'{{name}}\''))({name: serviceInstance.name}),
        errorMessage: gettext('Failed to unregister endpoint'),
        buttonText: {
          yes: gettext('Unregister'),
          no: gettext('Cancel')
        },
        callback: function () {
          var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
          serviceInstanceModel.remove(serviceInstance).then(function () {
            notificationsService.notify('success', gettext('Successfully unregistered endpoint \'{{name}}\''), {
              name: serviceInstance.name
            });
            updateInstances().then(function () {
              updateInstancesCache(endpoints);
              if (serviceInstance.cnsi_type === 'hcf') {
                authModel.remove(serviceInstance.guid);
              }
            });
          });
        }
      });
    }

    function _connect(endpoints, serviceInstance) {
      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      that.dialog = credentialsDialog.show({
        activeServiceInstance: serviceInstance,
        onConnectCancel: function () {
          if (that.dialog) {
            that.dialog.close();
            that.dialog = undefined;
          }
        },
        onConnectSuccess: function () {
          if (that.dialog) {
            that.dialog.close();
            that.dialog = undefined;
          }
          updateInstances().then(function () {
            updateInstancesCache(endpoints);
            switch (serviceInstance.cnsi_type) {
              case 'hcf':
                // Initialise AuthModel for service
                authModel.initializeForEndpoint(serviceInstance.guid);
                break;
              case 'hce':
                vcsService.updateInstances().then(function () {
                  vcsService.updateInstancesCache(endpoints);
                });
                break;
            }
          });
        }
      });
    }

    function _disconnect(endpoints, serviceInstance) {
      var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      userServiceInstanceModel.disconnect(serviceInstance.guid)
        .catch(function (error) {
          notificationsService.notify('error', gettext('Failed to disconnect endpoint \'{{name}}\''), {
            timeOut: 10000,
            name: serviceInstance.name
          });
          return $q.reject(error);
        })
        .then(function () {
          notificationsService.notify('success', gettext('Successfully disconnected endpoint \'{{name}}\''), {
            name: serviceInstance.name
          });
          updateInstancesCache(endpoints);
          if (serviceInstance.cnsi_type === 'hcf') {
            authModel.remove(serviceInstance.guid);
          }
        });
    }
  }

})();
