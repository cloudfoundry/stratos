(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary')
    .factory('cfEditApp', editAppFactory);

  /**
   * @name editAppFactory
   * @description Factory get Show Edit App dialog
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.framework.widgets.frameworkAsyncTaskDialog} frameworkAsyncTaskDialog - Async Task Dialog service
   */
  function editAppFactory(modelManager, frameworkAsyncTaskDialog) {
    return {

      /**
       * @name display
       * @description Display Edit App Dialog
       * @param {String} cnsiGuid CNSI GUID
       * @param {String} appGuid  Application GUID
       * @returns {*} frameworkAsyncTaskDialog
       */
      display: function (cnsiGuid, appGuid) {

        var model = modelManager.retrieve('cloud-foundry.model.application');
        var updateAppPromise = function (updatedAppSpec) {
          return model.update(cnsiGuid, appGuid, updatedAppSpec);
        };

        var data = {
          name: model.application.summary.name,
          memory: model.application.summary.memory,
          instances: model.application.summary.instances,
          enable_ssh: model.application.summary.enable_ssh
        };

        return frameworkAsyncTaskDialog(
          {
            title: 'app-tabs.summary.summary-panel.edit-dialog.title',
            templateUrl: 'plugins/cloud-foundry/view/applications/' +
            'application/summary/edit-app/edit-app.html',
            submitCommit: true,
            buttonTitles: {
              submit: 'buttons.save'
            },
            class: 'dialog-form',
            dialog: true
          },
          {
            data: data,
            initial_ssh: model.application.summary.enable_ssh,
            space_allowed: model.application.space ? model.application.space.entity.allow_ssh : false
          },
          updateAppPromise
        );
      }
    };
  }
})();
