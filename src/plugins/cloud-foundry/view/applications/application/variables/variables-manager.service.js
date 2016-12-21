(function () {
  'use strict';

  /**
   * @name cloud-foundry.view.applications.application.variables.manageDialog
   * @description Service for adding, editing and deleting application variables
   **/
  angular
    .module('cloud-foundry.view.applications.application.variables')
    .factory('cloud-foundry.view.applications.application.variables.manager', serviceFactory);

  serviceFactory.$inject = [
    '$q',
    'app.model.modelManager',
    'helion.framework.widgets.detailView'
  ];

  function serviceFactory($q, modelManager, detailView) {
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
        return detailView({
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
        return detailView({
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

  ApplicationVariablesDialogController.$inject = [
    'app.model.modelManager',
    '$uibModalInstance',
    'context'
  ];

  function ApplicationVariablesDialogController(modelManager, $uibModalInstance, context) {
    this.$modal = $uibModalInstance;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.cnsiGuid = context.cnsiGuid;
    this.id = context.guid;
    this.addError = false;
    this.isEdit = !!(context && context.variableName);
    if (this.isEdit) {
      this.varName = context.variableName;
      this.varValue = this.model.application.variables.environment_json[this.varName];
    } else {
      this.varName = '';
      this.varValue = '';
    }
  }

  angular.extend(ApplicationVariablesDialogController.prototype, {
    /**
     * @function applyChange
     * @description Add or Update the application variable
     * @public
     **/
    applyChange: function () {
      var that = this;
      this.addError = false;
      var vars = _.clone(this.model.application.variables.environment_json);
      vars[this.varName] = this.varValue;
      var updateData = {environment_json: vars};
      this.model.update(this.cnsiGuid, this.id, updateData).then(function () {
        that.$modal.close();
      }).catch(function () {
        that.addError = true;
      });
    }
  });

})();
