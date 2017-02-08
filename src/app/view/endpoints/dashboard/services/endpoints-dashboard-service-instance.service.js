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
    'app.view.endpoints.dashboard.dashboardService',
    'app.view.endpoints.dashboard.vcsService',
    'app.utils.utilsService',
    'app.error.errorService',
    'app.view.notificationsService',
    'app.view.credentialsDialog',
    'helion.framework.widgets.dialog.confirm',
    'app.event.eventService',
    'app.view.registerServiceViaHsm'

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
   * @param {app.view.endpoints.dashboard.dashboardService} dashboardService - service to support endpoints dashboard
   * @param {app.model.modelManager} vcsService - service to view and manage VCS endpoints in the endpoints dashboard
   * @param {app.utils.utilsService} utilsService - the utils service
   * @param {app.error.errorService} errorService - service to show custom errors below title bar
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   * @param {app.view.credentialsDialog} credentialsDialog - the credentials dialog service
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the confirmation dialog service
   * @param {app.event.eventService} eventService - the event service
   * @param {app.view.registerServiceViaHsm} registerServiceViaHsm - service that will discover and optionally register
   * services discovered in hsm
   * @returns {object} the service instance service
   */
  function cnsiServiceFactory($q, $state, $interpolate, modelManager, dashboardService, vcsService, utilsService, errorService,
                                         notificationsService, credentialsDialog, confirmDialog, eventService, registerServiceViaHsm) {
    var that = this;
    var endpointPrefix = 'cnsi_';

    return {
      haveInstances: haveInstances,
      updateInstances: updateInstances,
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

    function _setEndpointVisit(isValid, serviceInstance, endpoint) {
      // Some service types have more detail available
      if (isValid) {
        switch (serviceInstance.cnsi_type) {
          case 'hcf':
            endpoint.visit = function () {
              return $state.href('endpoint.clusters.cluster.detail.organizations', {guid: serviceInstance.guid});
            };
            break;
          case 'hsm':
            endpoint.visit = function () {
              return $state.href('sm.endpoint.detail.instances', {guid: serviceInstance.guid});
            };
            break;
        }
      }
    }

    /**
     * @function createEndpointEntries
     * @memberOf app.view.endpoints.dashboard.cnsiService
     * @description convert the model service instances into endpoints entries
     * @param {Array} endpoints - collection of existing endpoints
     * @public
     */
    function createEndpointEntries() {
      var activeEndpointsKeys = [];
      var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
      var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      var userAccount = modelManager.retrieve('app.model.account');
      var endpoints = dashboardService.endpoints;
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
        var hide = false;
        if (!reuse) {
          endpoint = {
            key: eKey
          };
          switch (serviceInstance.cnsi_type) {
            case 'hcf':
              endpoint.type = utilsService.getOemConfiguration().CLOUD_FOUNDRY;
              break;
            case 'hce':
              endpoint.type = utilsService.getOemConfiguration().CODE_ENGINE;
              break;
            case 'hsm':
              endpoint.type = 'Helion Service Manager';
              // Only Console admins can see HSM endpoints
              hide = !userAccount.isAdmin();
              break;
            default:
              endpoint.type = gettext('Unknown');
          }
          if (!hide) {
            endpoints.push(endpoint);
          }
        } else {
          delete endpoint.error;
        }
        activeEndpointsKeys.push(endpoint.key);

        endpoint.actions = _createInstanceActions(isValid, hasExpired);
        endpoint.visit = undefined;
        _setEndpointVisit(isValid, serviceInstance, endpoint);
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

        // required for smart-table sorting
        endpoint.connected = endpoint.getStatus();

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

      _cleanupStaleEndpoints(activeEndpointsKeys);

    }

    function _cleanupStaleEndpoints(activeEndpointsKeys) {

      var allEndpoints = dashboardService.endpoints;
      var myEndpoints = _.filter(allEndpoints, function (anEndpoint) {
        return anEndpoint.key.indexOf(endpointPrefix) === 0;
      });

      var staleEndpointsKeys = _.differenceWith(myEndpoints, activeEndpointsKeys, function (anEndpoint, aKey) {
        return anEndpoint.key === aKey;
      }).map(function (anEndpoint) {
        return anEndpoint.key;
      });

      for (var i = allEndpoints.length - 1; i >= 0; i--) {
        var endpoint = allEndpoints[i];
        if (staleEndpointsKeys.indexOf(endpoint.key) > -1) {
          allEndpoints.splice(i, 1);
        }
      }
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

    function _createInstanceActions(isConnected, expired) {
      var actions = [];

      if (!isConnected) {
        actions.push({
          name: gettext('Connect'),
          execute: function (serviceInstance) {
            _connect(serviceInstance);
          }
        });
      }

      if (isConnected || expired) {
        actions.push({
          name: gettext('Disconnect'),
          execute: function (serviceInstance) {
            _disconnect(serviceInstance);
          }
        });
      }

      var currentUserAccount = modelManager.retrieve('app.model.account');
      if (currentUserAccount.isAdmin()) {
        actions.push({
          name: gettext('Unregister'),
          execute: function (serviceInstance) {
            _unregister(serviceInstance);
          }
        });
      }
      return actions;
    }

    function _unregister(serviceInstance) {
      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      confirmDialog({
        title: gettext('Unregister Endpoint'),
        description: $interpolate(gettext('Are you sure you want to unregister endpoint \'{{name}}\'?'))({name: serviceInstance.name}),
        errorMessage: gettext('Failed to unregister endpoint'),
        submitCommit: true,
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
              createEndpointEntries();
              switch (serviceInstance.cnsi_type) {
                case 'hcf':
                  authModel.remove(serviceInstance.guid);
                  break;
                case 'hce':
                  dashboardService.refreshCodeEngineVcses().then(function () {
                    vcsService.createEndpointEntries();
                  });
                  break;
              }
            });
          });
        }
      });
    }

    function _connect(serviceInstance) {
      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      that.dialog = credentialsDialog.show({
        activeServiceInstance: serviceInstance,
        hideNotification: true,
        onConnectCancel: function () {
          if (that.dialog) {
            that.dialog.close();
            that.dialog = undefined;
          }
        },
        onConnectSuccess: function (userServiceInstance, credentials) {

          // Note - Always close first, even in the case of the register via hsm dialog
          if (that.dialog) {
            that.dialog.close();
            that.dialog = undefined;
          }

          var registerViaHsmPromise;
          if (serviceInstance.cnsi_type === 'hsm' && modelManager.retrieve('app.model.account').isAdmin()) {
            registerViaHsmPromise = registerServiceViaHsm.show(serviceInstance.guid, credentials);
          } else {
            registerViaHsmPromise = $q.resolve({showNotification: true});
          }

          registerViaHsmPromise
            .then(function (result) {
              if (result && result.showNotification) {
                credentialsDialog.notify(serviceInstance.name);
              }
              return updateInstances();
            })
            .then(function () {
              createEndpointEntries();
              switch (serviceInstance.cnsi_type) {
                case 'hcf':
                  // Initialise AuthModel for service
                  authModel.initializeForEndpoint(serviceInstance.guid);
                  break;
                case 'hce':
                  $q.all([vcsService.updateInstances(), dashboardService.refreshCodeEngineVcses()])
                    .then(function () {
                      vcsService.createEndpointEntries();
                    });
                  break;
              }
              eventService.$emit(eventService.events.ENDPOINT_CONNECT_CHANGE, true);
            });
        }
      });
    }

    function _disconnect(serviceInstance) {
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
          createEndpointEntries();
          switch (serviceInstance.cnsi_type) {
            case 'hcf':
              authModel.remove(serviceInstance.guid);
              break;
            case 'hce':
              dashboardService.refreshCodeEngineVcses()
                .then(function () {
                  // Note: we could optimize this with the createEndpointEntries above somehow
                  vcsService.createEndpointEntries();
                });
              break;
          }
          eventService.$emit(eventService.events.ENDPOINT_CONNECT_CHANGE, true);
        });
    }
  }

})();
