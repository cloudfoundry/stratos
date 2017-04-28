(function () {
  'use strict';

  /**
   * @name cloud-foundry.view.applications.application.variables.manageDialog
   * @description Service for adding, editing and deleting application variables
   **/
  angular
    .module('cloud-foundry.view.applications.application.variables')
    .factory('cfVariablesManager', serviceFactory);

  function serviceFactory($q, modelManager, frameworkDetailView) {
    return {
      /**
       * @function add
       * @description Add an application variable
       * @param {string} cnsiGuid - the HCF Service GUID
       * @param {string} id - the application GUID
       * @returns {object} The resolved/rejected promise
       * @public
       **/
      add: function (cnsiGuid, id) {
        return frameworkDetailView({
          controller: ApplicationVariablesDialogController,
          controllerAs: 'appVarCtrl',
          detailViewTemplateUrl: 'plugins/cloud-foundry/view/applications/application/variables/variables-dialog.html',
          class: 'detail-view-thin' // NOTE: turning this into a dialog doesn't work well for some reason (width is incorrect)
        }, {
          cnsiGuid: cnsiGuid,
          guid: id
        }).result;
      },
      /**
       * @function edit
       * @description Edit an application variable
       * @param {string} cnsiGuid - the HCF Service GUID
       * @param {string} id - the application GUID
       * @param {string} variableName - the name of the variable to delete
       * @returns {object} The resolved/rejected promise
       * @public
       **/
      edit: function (cnsiGuid, id, variableName) {
        return frameworkDetailView({
          controller: ApplicationVariablesDialogController,
          controllerAs: 'appVarCtrl',
          detailViewTemplateUrl: 'plugins/cloud-foundry/view/applications/application/variables/variables-dialog.html',
          class: 'detail-view-thin'
        }, {
          cnsiGuid: cnsiGuid,
          guid: id,
          variableName: variableName
        }).result;
      },

      /**
       * @function delete
       * @description Delete an application variable
       * @param {string} cnsiGuid - the HCF Service GUID
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
  }

  function ApplicationVariablesDialogController(modelManager, $uibModalInstance, context) {

    var vm = this;

    var $modal = $uibModalInstance;
    var cnsiGuid = context.cnsiGuid;

    vm.model = modelManager.retrieve('cloud-foundry.model.application');
    vm.id = context.guid;
    vm.addError = false;
    vm.isEdit = !!(context && context.variableName);
    if (vm.isEdit) {
      vm.varName = context.variableName;
      vm.varValue = vm.model.application.variables.environment_json[vm.varName];
    } else {
      vm.varName = '';
      vm.varValue = '';
    }

    vm.applyChange = applyChange;

    /**
     * @function applyChange
     * @description Add or Update the application variable
     * @public
     **/
    function applyChange() {
      vm.addError = false;
      var vars = _.clone(vm.model.application.variables.environment_json);
      vars[vm.varName] = vm.varValue;
      var updateData = {environment_json: vars};
      vm.model.update(cnsiGuid, vm.id, updateData).then(function () {
        $modal.close();
      }).catch(function () {
        vm.addError = true;
      });
    }
  }

})();
