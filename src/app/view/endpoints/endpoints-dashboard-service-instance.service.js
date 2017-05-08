(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .factory('appEndpointsCnsiService', cnsiServiceFactory);

  /**
   * @namespace app.view.endpoints.dashboard
   * @memberOf app.view.endpoints.dashboard
   * @name appEndpointsCnsiService
   * @description provide functionality to support cnsi service instances (cnsisi..) in the endpoints dashboard
   * @param {object} $q - the Angular $q service
   * @param {object} $interpolate - the angular $interpolate service
   * @param {object} $translate - the angular $translate service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.view.endpoints.dashboard.appEndpointsDashboardService} appEndpointsDashboardService - service to support endpoints dashboard
   * @param {app.utils.appUtilsService} appUtilsService - the appUtilsService service
   * @param {app.appUtilsService.appErrorService} appErrorService - service to show custom errors below title bar
   * @param {app.view.appNotificationsService} appNotificationsService - the toast notification service
   * @param {app.view.appCredentialsDialog} appCredentialsDialog - the credentials dialog service
   * @param {helion.framework.widgets.dialog.frameworkDialogConfirm} frameworkDialogConfirm - the confirmation dialog service
   * @param {app.appUtilsService.appEventService} appEventService - the event service
   * @returns {object} the service instance service
   */
  function cnsiServiceFactory($q, $interpolate, $translate, modelManager, appEndpointsDashboardService,
                              appUtilsService, appErrorService, appNotificationsService,
                              appCredentialsDialog, frameworkDialogConfirm, appEventService) {
    var that = this;
    var endpointPrefix = 'cnsi_';
    var cnsiEndpointProviders = {};

    var service = {
      getEndpointsToRegister: getEndpointsToRegister,
      haveInstances: haveInstances,
      updateInstances: updateInstances,
      createEndpointEntries: createEndpointEntries,
      clear: clear,
      cnsiEndpointProviders: cnsiEndpointProviders,
      callEndpointProvidersOfType: callEndpointProvidersOfType,
      callEndpointProviders: callEndpointProviders
    };

    appEndpointsDashboardService.endpointsProviders.push(service);

    return service;

    function getEndpointsToRegister() {
      return _
        .chain(cnsiEndpointProviders)
        .filter(function (provider) {
          return !provider.isHidden(modelManager.retrieve('app.model.account').isAdmin());
        })
        .forEach(function (endpoint) {
          endpoint.label = endpoint.label || $translate.instant(endpoint.register.html.type.name);
        })
        .sort('label')
        .value();
    }

    /**
     * @function _updateEndpoints
     * @memberOf app.view.endpoints.dashboard.appEndpointsCnsiService
     * @description Synchronous. Are there any cached service instances?
     * @returns {boolean}
     * @public
     */
    function haveInstances() {
      var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
      return serviceInstanceModel.serviceInstances && serviceInstanceModel.serviceInstances.length > 0;
    }

    /**
     * @function _updateEndpoints
     * @memberOf app.view.endpoints.dashboard.appEndpointsCnsiService
     * @description Refresh the cnsi service instances within the model
     * @returns {object} a promise
     * @public
     */
    function updateInstances() {
      var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
      var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      var consoleInfo = modelManager.retrieve('app.model.consoleInfo');
      return $q.all([serviceInstanceModel.list(), userServiceInstanceModel.list(), consoleInfo.getConsoleInfo()])
        .then(function () {

          var errors = _.filter(userServiceInstanceModel.serviceInstances, {error: true});
          errors = _.map(errors, 'name');

          var userServicesCount = Object.keys(userServiceInstanceModel.serviceInstances).length;

          // Ensure the wording of any errors do not use 'connect' to avoid misleading 'connected' stats in tiles.
          // (otherwise we need to add additional 'errored' line to tiles)
          if (!userServicesCount || errors.length === 0) {
            // If there are no services or no errors continue as normal
            appErrorService.clearAppError();
          } else if (errors.length === 1) {
            var errorMessage = gettext('The Console could not contact the endpoint named "{{name}}". Try reconnecting to this endpoint to resolve this problem.');
            appErrorService.setAppError($interpolate(errorMessage)({name: errors[0]}));
          } else if (errors.length > 1) {
            appErrorService.setAppError(gettext('The Console could not contact multiple endpoints.'));
          }

        });
    }

    /**
     * @function createEndpointEntries
     * @memberOf app.view.endpoints.dashboard.appEndpointsCnsiService
     * @description convert the model service instances into endpoints entries
     * @public
     */
    function createEndpointEntries() {
      var activeEndpointsKeys = [];
      var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
      var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      var userAccount = modelManager.retrieve('app.model.account');
      var endpoints = appEndpointsDashboardService.endpoints;
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
            type: gettext('Unknown')
          };
          if (!callEndpointProvidersOfType(serviceInstance.cnsi_type, 'isHidden', userAccount.isAdmin())) {
            endpoints.push(endpoint);
          }
        } else {
          delete endpoint.error;
        }
        activeEndpointsKeys.push(endpoint.key);

        endpoint.actions = _createInstanceActions(isValid, hasExpired);
        endpoint.visit = undefined;
        endpoint.url = appUtilsService.getClusterEndpoint(serviceInstance);
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

        callEndpointProvidersOfType(serviceInstance.cnsi_type, 'update', serviceInstance, isValid, endpoint);
      });

      _cleanupStaleEndpoints(activeEndpointsKeys);

    }

    function callEndpointProvidersOfType(type, method) {
      var func = _.get(cnsiEndpointProviders, type + '.' + method);
      if (angular.isFunction(func)) {
        return func.apply(this, _.slice(arguments, 2));
      }
    }

    function callEndpointProviders(method) {
      var tasks = [];
      var args = Array.prototype.slice.call(arguments);
      _.forEach(service.cnsiEndpointProviders, function (endpointProvider) {
        var promise = callEndpointProvidersOfType.apply(this, [endpointProvider.cnsi_type, method].concat(args.slice(1)));
        tasks.push(promise || $q.resolve());
      });
      return $q.all(tasks);
    }

    function _cleanupStaleEndpoints(activeEndpointsKeys) {

      var allEndpoints = appEndpointsDashboardService.endpoints;
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
     * @memberOf app.view.endpoints.dashboard.appEndpointsCnsiService
     * @description Synchronous. clear any local data before leaving the dashboard
     * @public
     */
    function clear() {
      appErrorService.clearAppError();
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
      frameworkDialogConfirm({
        title: gettext('Unregister Endpoint'),
        description: $interpolate(gettext('Are you sure you want to unregister endpoint \'{{name}}\'?'))({name: serviceInstance.name}),
        errorMessage: gettext('Failed to unregister endpoint'),
        submitCommit: true,
        buttonText: {
          yes: gettext('Unregister'),
          no: gettext('Cancel')
        },
        callback: function () {
          modelManager.retrieve('app.model.serviceInstance').remove(serviceInstance)
            .then(function () {
              appNotificationsService.notify('success', gettext('Successfully unregistered endpoint \'{{name}}\''), {
                name: serviceInstance.name
              });
              updateInstances().then(function () {
                createEndpointEntries();
                return callEndpointProvidersOfType(serviceInstance.cnsi_type, 'unregister', serviceInstance);
              });
            })
            .then(function () {
              // Ensure that the user service instance list is updated before sending change notification
              return modelManager.retrieve('app.model.serviceInstance.user').list().then(function () {
                appEventService.$emit(appEventService.events.ENDPOINT_CONNECT_CHANGE, true);
              });
            });
        }
      });
    }

    function _connect(serviceInstance) {
      that.dialog = appCredentialsDialog.show({
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
          updateInstances()
            .then(function () {
              createEndpointEntries();
              return callEndpointProvidersOfType(serviceInstance.cnsi_type, 'connect', serviceInstance);
            })
            .then(function () {
              appEventService.$emit(appEventService.events.ENDPOINT_CONNECT_CHANGE, true);
            });
        }
      });
    }

    function _disconnect(serviceInstance) {
      var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      userServiceInstanceModel.disconnect(serviceInstance.guid)
        .catch(function (error) {
          appNotificationsService.notify('error', gettext('Failed to disconnect endpoint \'{{name}}\''), {
            timeOut: 10000,
            name: serviceInstance.name
          });
          return $q.reject(error);
        })
        .then(function () {
          appNotificationsService.notify('success', gettext('Successfully disconnected endpoint \'{{name}}\''), {
            name: serviceInstance.name
          });
          createEndpointEntries();
          return callEndpointProvidersOfType(serviceInstance.cnsi_type, 'disconnect', serviceInstance);
        })
        .then(function () {
          // Ensure that the user service instance list is updated before sending change notification
          return modelManager.retrieve('app.model.serviceInstance.user').list().then(function () {
            appEventService.$emit(appEventService.events.ENDPOINT_CONNECT_CHANGE, true);
          });
        });
    }
  }

})();
