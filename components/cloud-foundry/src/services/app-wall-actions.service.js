(function () {
  'use strict';

  angular
    .module('cloud-foundry.service')
    .factory('cfAppWallActions', appWallActions);

  /**
   * @namespace cloud-foundry.service
   * @memberOf cloud-foundry.service
   * @name cfAppWallActions
   * @description extention point to allow plugins to add 'app wall actions' such as add and deploy to the cf app wall.
   * @param {frameworkDetailView} frameworkDetailView - Service to show a modal
   * @returns {object} the service instance service
   */
  function appWallActions(frameworkDetailView) {

    var service = {
      actions: []
    };

    service.actions.push({
      id: 'app-wall-add-new-application-btn',
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
