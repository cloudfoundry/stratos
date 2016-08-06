(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.services')
    .factory('cloud-foundry.view.applications.services.serviceInstanceService', serviceInstanceFactory);

  serviceInstanceFactory.$inject = [
    '$interpolate',
    'app.model.modelManager',
    'helion.framework.widgets.detailView',
    'helion.framework.widgets.dialog.confirm'
  ];

  /**
   * @memberof cloud-foundry.view.applications.services
   * @name serviceInstanceService
   * @description A service instance common service
   * @param {object} $interpolate - the Angular $interpolate service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {helion.framework.widgets.detailView} detailView - the detail view service
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the confirm dialog
   * @returns {object} A service instance factory
   */
  function serviceInstanceFactory($interpolate, modelManager, detailView, confirmDialog) {
    return {
      /**
       * @function unbindServiceFromApp
       * @memberof cloud-foundry.view.applications.services.serviceInstanceService
       * @description Unbind service instance from application
       * @param {string} cnsiGuid - the CNSI guid
       * @param {string} appGuid - the application GUID
       * @param {string} serviceBindingGuid - the service binding GUID
       * @param {string} serviceInstanceName - the service instance name
       * @param {function} callbackFunc - an optional callback function
       * @returns {promise} The confirm dialog promise object
       * @public
       */
      unbindServiceFromApp: function (cnsiGuid, appGuid, serviceBindingGuid, serviceInstanceName, callbackFunc) {
        var appModel = modelManager.retrieve('cloud-foundry.model.application');
        var bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
        var msgStr = gettext('Are you sure you want to detach {{name}}?');
        return confirmDialog({
          title: gettext('Detach Service'),
          description: $interpolate(msgStr)({name: serviceInstanceName}),
          errorMessage: gettext('There was a problem detaching this service. Please try again. If this error persists, please contact the Administrator.'),
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
              });
          }
        });
      },

      /**
       * @function viewEnvVariables
       * @memberof cloud-foundry.view.applications.services.serviceInstanceService
       * @description Unbind service instance from application
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
              var titleStr = gettext('{{appName}}: Environmental Variables');
              var config = {
                templateUrl: 'plugins/cloud-foundry/view/applications/services/service-instance/env-variables.html',
                title: $interpolate(titleStr)({appName: appSummary.name})
              };
              var context = {
                variables: instanceVars
              };
              detailView(config, context);
            }
          });
      }
    };
  }

})();
