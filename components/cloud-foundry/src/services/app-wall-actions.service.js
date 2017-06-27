(function () {
  'use strict';

  angular
    .module('cloud-foundry.service')
    .factory('cfAppWallActions', appWallActions)
    .run(register);

  /* eslint-disable no-unused-vars */
  // Ensure that an instance of cfAppWallActions is created by injecting it here.
  function register(cfAppWallActions) { }
  /* eslint-enable no-unused-vars */;

  /**
   * @namespace cloud-foundry.service
   * @memberOf cloud-foundry.service
   * @name cfEndpointService
   * @description provide functionality to support cloud foundry cnsi service instances (cnsisi..) in the endpoints
   * dashboard
   * @param {cfHideEndpoint} cfHideEndpoint - Config - Hide the endpoint from endpoint dashboard components
   * @param {object} $q - the Angular $q service
   * @param {object} $state - the Angular $state service
   * @param {object} $translate - the $translate service
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.view.endpoints.dashboard.appEndpointsCnsiService} appEndpointsCnsiService - service to support dashboard with cnsi type endpoints
   * dashboard
   * @returns {object} the service instance service
   */
  function appWallActions(frameworkDetailView) {

    var service = {
      actions: []
    };

    service.actions.push({
      label: 'app-wall.add-application',
      position: 1,
      show: function (context) {
        if (angular.isFunction(context.show)) {
          return context.show();
        }
        return true;
      },
      disable: function (context) {
        if (angular.isFunction(context.disable)) {
          return context.disable();
        }
        return false;
      },
      action: function addApplication() {
        frameworkDetailView(
          {
            templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/add-app-dialog.html',
            dialog: true,
            class: 'dialog-form-large'
          }
        );
      }
    });

    return service;
  }

})();
