(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.services')
    .factory('cfServiceInstanceService', serviceInstanceFactory);

  /**
   * @memberof cloud-foundry.view.applications.services
   * @name cfServiceInstanceService
   * @description A service instance common service
   * @param {object} $log - the Angular $log service
   * @param {object} $interpolate - the Angular $interpolate service
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.view.appNotificationsService} appNotificationsService - the toast notification service
   * @param {helion.framework.widgets.frameworkDetailView} frameworkDetailView - the detail view service
   * @param {helion.framework.widgets.dialog.frameworkDialogConfirm} frameworkDialogConfirm - the confirm dialog
   * @returns {object} A service instance factory
   */
  function serviceInstanceFactory($log, $interpolate, $q, modelManager, appNotificationsService, frameworkDetailView,
                                  frameworkDialogConfirm) {
    var appModel = modelManager.retrieve('cloud-foundry.model.application');
    var bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    var instanceModel = modelManager.retrieve('cloud-foundry.model.service-instance');

    return {
      /**
       * @function unbindServiceFromApp
       * @memberof cfServiceInstanceService
       * @description Unbind service instance from application
       * @param {string} cnsiGuid - the CNSI guid
       * @param {string} appGuid - the application GUID
       * @param {string} serviceBindingGuid - the service binding GUID
       * @param {string} serviceInstanceName - the service instance name
       * @param {function=} callbackFunc - an optional callback function
       * @returns {promise} The confirm dialog promise object
       * @public
       */
      unbindServiceFromApp: function (cnsiGuid, appGuid, serviceBindingGuid, serviceInstanceName, callbackFunc) {
        var msgStr = gettext('Are you sure you want to detach {{name}}?');
        return frameworkDialogConfirm({
          title: gettext('Detach Service'),
          description: $interpolate(msgStr)({name: serviceInstanceName}),
          errorMessage: gettext('There was a problem detaching this service. Please try again. If this error persists, please contact the Administrator.'),
          submitCommit: true,
          buttonText: {
            yes: gettext('Detach'),
            no: gettext('Cancel')
          },
          callback: function () {
            return bindingModel.deleteServiceBinding(cnsiGuid, serviceBindingGuid)
              .then(function () {
                if (angular.isDefined(callbackFunc)) {
                  callbackFunc();
                }
                return appModel.getAppSummary(cnsiGuid, appGuid);
              })
              .catch(function (error) {
                $log.error('Failed to delete service binding: ', error);
                // Swallow error in rejected promise (most likely a failed http response) to ensure default msg is used
                return $q.reject();
              });
          }
        });
      },

      /**
       * @function unbindServiceFromApps
       * @memberof cfServiceInstanceService
       * @description Unbind service instance from applications
       * @param {string} cnsiGuid - the CNSI guid
       * @param {Array} serviceBindings - collection of service bindings to unbind. The inline relation of properties
       * should descend as far as app.
       * @param {string} serviceInstanceName - the service instance name
       * @param {function=} callbackFunc - an optional callback function
       * @returns {promise} promise once execution completed. Returns count of successful unbinds. If rejected this could
       * mean confirm dialog was cancelled or ALL service instances failed to unbind
       * @public
       */
      unbindServiceFromApps: function (cnsiGuid, serviceBindings, serviceInstanceName, callbackFunc) {
        var msgStr = gettext('Are you sure you want to detach {{name}}?');
        return frameworkDialogConfirm({
          title: gettext('Detach Service'),
          description: $interpolate(msgStr)({name: serviceInstanceName}),
          errorMessage: gettext('There was a problem detaching this service. Please try again. If this error persists, please contact the Administrator.'),
          submitCommit: true,
          buttonText: {
            yes: gettext('Detach'),
            no: gettext('Cancel')
          },
          callback: function () {
            var promises = [];
            var refreshAppGuids = [];
            var failedCount = 0;
            _.forEach(serviceBindings, function (serviceBinding) {
              var promise = bindingModel.deleteServiceBinding(cnsiGuid, serviceBinding.metadata.guid)
                .then(function () {
                  refreshAppGuids.push(serviceBinding.entity.app.metadata.guid);
                })
                .catch(function () {
                  failedCount++;
                  // Don't 'rethrow' error
                });
              promises.push(promise);
            });
            return $q.all(promises)
              .then(function () {
                if (failedCount > 0) {
                  appNotificationsService.notify('warning', gettext('Some applications failed to detach from the service instance'));
                } else {
                  appNotificationsService.notify('success', gettext('Service instance successfully detached'));
                }

                if (angular.isDefined(callbackFunc)) {
                  callbackFunc();
                }

                var promises = [];
                _.forEach(refreshAppGuids, function (appGuid) {
                  promises.push(appModel.getAppSummary(cnsiGuid, appGuid));
                });
                return $q.all(promises);
              })
              .then(function () {
                return serviceBindings.length - failedCount;
              })
              .catch(function (error) {
                $log.error('Failed to delete service binding: ', error);
                // Swallow error in rejected promise (most likely a failed http response) to ensure default msg is used
                return $q.reject();
              });
          }
        });
      },

      /**
       * @function deleteService
       * @memberof cfServiceInstanceService
       * @description Delete a service instance.
       * @param {string} cnsiGuid - the CNSI guid
       * @param {string} serviceInstanceGuid - the service instance GUID
       * @param {string} serviceInstanceName - the service instance name
       * @param {function=} callbackFunc - an optional callback function
       * @returns {promise} The confirm dialog promise object
       * @public
       */
      deleteService: function (cnsiGuid, serviceInstanceGuid, serviceInstanceName, callbackFunc) {
        var msgStr = gettext('Are you sure you want to delete {{name}}?');
        return frameworkDialogConfirm({
          title: gettext('Delete Service'),
          description: $interpolate(msgStr)({name: serviceInstanceName}),
          errorMessage: gettext('There was a problem deleting this service. Please try again. If this error persists, please contact the Administrator.'),
          submitCommit: true,
          buttonText: {
            yes: gettext('Delete'),
            no: gettext('Cancel')
          },
          callback: function () {
            var params = {
              recursive: true,
              async: false
            };
            return instanceModel.deleteServiceInstance(cnsiGuid, serviceInstanceGuid, params)
              .then(function () {
                appNotificationsService.notify('success', gettext('Service instance successfully deleted'));
                if (angular.isDefined(callbackFunc)) {
                  callbackFunc();
                }
              })
              .catch(function (error) {
                $log.error('Failed to delete service instance: ', error);
                // Swallow error in rejected promise (most likely a failed http response) to ensure default msg is used
                return $q.reject();
              });
          }
        });
      },

      /**
       * @function viewEnvVariables
       * @memberof cfServiceInstanceService
       * @description view the environment variables of an app
       * @param {string} cnsiGuid - the CNSI guid
       * @param {object} appSummary - the application summary data
       * @param {string} serviceKey - the service label
       * @param {object} instance - the instance
       * @returns {promise} A promise object
       * @public
       */
      viewEnvVariables: function (cnsiGuid, appSummary, serviceKey, instance) {
        var appModel = modelManager.retrieve('cloud-foundry.model.application');
        return appModel.getEnv(cnsiGuid, appSummary.guid)
          .then(function (variables) {
            var vcap = variables.system_env_json.VCAP_SERVICES;
            if (angular.isDefined(vcap) && vcap[serviceKey]) {
              var instanceVars = _.find(vcap[serviceKey], { name: instance.name });
              var titleStr = gettext('{{instanceName}}: Variables');
              var config = {
                templateUrl: 'plugins/cloud-foundry/view/applications/services/service-instance/env-variables.html',
                title: $interpolate(titleStr)({instanceName: instance.name})
              };
              var context = {
                variables: instanceVars
              };
              frameworkDetailView(config, context);
            }
          });
      }
    };
  }

})();
