(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary')
    .factory('cloud-foundry.view.applications.application.summary.editApp', editAppFactory);

  editAppFactory.$inject = [
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  function editAppFactory(modelManager, asyncTaskDialog) {
    return {
      add: function (cnsiGuid, appGuid) {

        var model = modelManager.retrieve('cloud-foundry.model.application');
        var updateAppPromise = function (updatedAppSpec) {
          return model.update(cnsiGuid, appGuid, updatedAppSpec);
        };

        var data = {
          name: model.application.summary.name,
          memory: model.application.summary.memory,
          instances: model.application.summary.instances
        }
        return asyncTaskDialog(
          {
            title: 'Edit App',
            templateUrl: 'plugins/cloud-foundry/view/applications/' +
            'application/summary/edit-app/edit-app.html'
          },
          {
            data: data,
            buttonTitles:{
              submit: 'Save'
            }
          },
          updateAppPromise
        );
      }
    };
  }
})();
