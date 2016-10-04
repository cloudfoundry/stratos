(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary')
    .factory('cloud-foundry.view.applications.application.summary.editApp', editAppFactory);

  editAppFactory.$inject = [
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  /**
   * @name editAppFactory
   * @description Factory get Show Edit App dialog
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {helion.framework.widgets.asyncTaskDialog} asyncTaskDialog - Async Task Dialog service
   */
  function editAppFactory(modelManager, asyncTaskDialog) {
    return {

      /**
       * @name display
       * @description Display Edit App Dialog
       * @param {String} cnsiGuid CNSI GUID
       * @param {String} appGuid  Application GUID
       * @returns {*} asyncTaskDialog
       */
      display: function (cnsiGuid, appGuid) {

        var model = modelManager.retrieve('cloud-foundry.model.application');
        var updateAppPromise = function (updatedAppSpec) {
          return model.update(cnsiGuid, appGuid, updatedAppSpec);
        };

        var data = {
          name: model.application.summary.name,
          memory: model.application.summary.memory,
          instances: model.application.summary.instances
        };

        return asyncTaskDialog(
          {
            title: 'Edit App',
            templateUrl: 'plugins/cloud-foundry/view/applications/' +
            'application/summary/edit-app/edit-app.html',
            buttonTitles: {
              submit: 'Save'
            },
            class: 'detail-view-thin'
          },
          {
            data: data
          },
          updateAppPromise
        );
      }
    };
  }
})();
