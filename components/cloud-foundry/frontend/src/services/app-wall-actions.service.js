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
      name: 'app-wall.add-application',
      icon: 'add_box',
      position: 1,
      hidden: function () {
        var hidden = _.get(this.context, 'hidden');
        if (angular.isFunction(hidden)) {
          return hidden();
        }
        return false;
      },
      disabled: function () {
        var disabled = _.get(this.context, 'disabled');
        if (angular.isFunction(disabled)) {
          return disabled();
        }
        return false;
      },
      execute: function addApplication() {
        var reload = _.get(this.context, 'reload');
        frameworkDetailView(
          {
            templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/add-app-dialog.html',
            dialog: true,
            class: 'dialog-form-large',
            hideClose: true
          }
        ).result.then(function (result) {
          // Do we need to reload the app collection to show the newly added app? This would be the case where
          // the route was not created/binded successfully
          if (_.get(result, 'reload') && angular.isFunction(reload)) {
            // Note - this won't show the app if the user selected a different cluster/org/guid than that of the filter
            reload();
          }
        });
      }
    });

    return service;
  }

})();
