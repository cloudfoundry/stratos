(function () {
  'use strict';

  /**
   * @name cloud-foundry.view.applications.application.variables.manageDialog
   * @description Service for adding, editing and deleting application variables
   **/
  angular
    .module('cloud-foundry.view.applications.application.variables')
    .factory('cfVariablesManager', serviceFactory);

  function serviceFactory($q, modelManager, frameworkAsyncTaskDialog) {
    return {
      /**
       * @function add
       * @description Add an application variable
       * @param {string} cnsiGuid - the CF Service GUID
       * @param {string} id - the application GUID
       * @returns {object} The resolved/rejected promise
       * @public
       **/
      add: function (cnsiGuid, id) {
        return show(cnsiGuid, id);
      },
      /**
       * @function edit
       * @description Edit an application variable
       * @param {string} cnsiGuid - the CF Service GUID
       * @param {string} id - the application GUID
       * @param {string} variableName - the name of the variable to delete
       * @returns {object} The resolved/rejected promise
       * @public
       **/
      edit: function (cnsiGuid, id, variableName) {
        return show(cnsiGuid, id, variableName);
      },

      /**
       * @function delete
       * @description Delete an application variable
       * @param {string} cnsiGuid - the CF Service GUID
       * @param {string} id - the application GUID
       * @param {string} variableName - the name of the variable to delete
       * @returns {object} The resolved/rejected promise
       * @public
       **/
      delete: function (cnsiGuid, id, variableName) {
        var model = modelManager.retrieve('cloud-foundry.model.application');
        var vars = _.clone(model.application.variables.environment_json);
        delete vars[variableName];
        var updateData = {environment_json: vars};
        return model.update(cnsiGuid, id, updateData).then(function (data) {
          if (data.error_code) {
            return $q.reject(data);
          }
        });
      }
    };

    function show(cnsiGuid, id, variableName) {
      var isEdit = !!variableName;
      var model = modelManager.retrieve('cloud-foundry.model.application');

      var context = {
        cnsiGuid: cnsiGuid,
        guid: id,
        variableName: variableName,
        isEdit: isEdit,
        data: {
          varName: isEdit ? variableName : '',
          varValue: isEdit ? model.application.variables.environment_json[variableName] : ''
        },
        description: isEdit ? 'app.app-info.app-tabs.variables.actions.edit-dialog.description' : 'app.app-info.app-tabs.variables.add-dialog.description'
      };

      return frameworkAsyncTaskDialog({
        title: isEdit ? 'app.app-info.app-tabs.variables.actions.edit-dialog.title' : 'app.app-info.app-tabs.variables.add-dialog.title',
        templateUrl: 'plugins/cloud-foundry/view/applications/application/variables/variables-dialog.html',
        submitCommit: true,
        buttonTitles: {
          submit: isEdit ? 'app.app-info.app-tabs.variables.actions.edit-dialog.submit-button' : 'app.app-info.app-tabs.variables.add-dialog.submit-button'
        },
        dialog: true,
        class: 'dialog-form'
      }, context, applyChange).result;

      /**
       * @function applyChange
       * @description Add or Update the application variable
       * @param {object} data - async dialog context.data object
       * @public
       * @returns {object} promise
       **/
      function applyChange(data) {
        var vars = _.clone(model.application.variables.environment_json);
        vars[data.varName] = data.varValue;
        var updateData = {environment_json: vars};
        return model.update(cnsiGuid, id, updateData).catch(function () {
          context.errorMsg = isEdit ? 'app.app-info.app-tabs.variables.actions.edit-dialog.error'
            : 'app.app-info.app-tabs.variables.add-dialog.error';
          return $q.reject();
        });
      }
    }
  }

})();
