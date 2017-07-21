(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.variables', [])
    .config(registerRoute)
    .run(registerAppTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.variables', {
      url: '/variables',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/variables/variables.html',
      controller: ApplicationVariablesController,
      controllerAs: 'applicationVariablesCtrl'
    });
  }

  function registerAppTab($stateParams, cfApplicationTabs, modelManager) {
    var canEditApp;
    cfApplicationTabs.tabs.push({
      position: 6,
      hide: function () {
        var model = modelManager.retrieve('cloud-foundry.model.application');
        if (!model.application.summary.space_guid) {
          return true;
        }
        if (angular.isUndefined(canEditApp)) {
          var cnsiGuid = $stateParams.cnsiGuid;
          var authModel = modelManager.retrieve('cloud-foundry.model.auth');

          canEditApp = authModel.isAllowed(cnsiGuid,
            authModel.resources.application,
            authModel.actions.update,
            model.application.summary.space_guid
          );
        }
        return !canEditApp;
      },
      uiSref: 'cf.applications.application.variables',
      uiSrefParam: function () {
        return {guid: $stateParams.guid};
      },
      label: 'app.app-info.app-tabs.variables.title',
      clearState: function () {
        canEditApp = undefined;
      }
    });
  }

  /**
   * @name ApplicationVariablesController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} cfVariablesManager - the Application Variables Manager service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} cnsiGuid - the CF Cluster GUID
   * @property {string} id - the application GUID
   */
  function ApplicationVariablesController(modelManager, $stateParams, cfVariablesManager) {
    var vm = this;

    var cnsiGuid = $stateParams.cnsiGuid;

    vm.model = modelManager.retrieve('cloud-foundry.model.application');
    vm.id = $stateParams.guid;
    vm.variableActions = [
      {name: 'app.app-info.app-tabs.variables.actions.edit', execute: _.bind(editVariable, vm)},
      {name: 'app.app-info.app-tabs.variables.actions.delete', execute: _.bind(deleteVariable, vm)}
    ];
    vm.deleteErrorMsg = 'app.app-info.app-tabs.variables.deleteError';

    vm.isBusy = false;
    vm.fetchError = false;
    vm.deleteError = false;

    vm.isObject = isObject;
    vm.hasVariables = hasVariables;
    vm.refreshVariables = refreshVariables;
    vm.addVariable = addVariable;
    vm.editVariable = editVariable;
    vm.deleteVariable = deleteVariable;

    vm.refreshVariables();

    /**
     * @function isObject
     * @description Determine if supplied var is an object
     * @param {object} v - variable
     * @returns {boolean} Indicating if value is an object
     * @public
     **/
    function isObject(v) {
      return angular.isObject(v);
    }

    /**
     * @function hasVariables
     * @description Determine if application has variables
     * @returns {boolean} Indicating if the application has variables
     * @public
     **/
    function hasVariables() {
      return angular.isDefined(vm.model.application.variables) &&
        angular.isDefined(vm.model.application.variables.environment_json) &&
        Object.keys(vm.model.application.variables.environment_json).length > 0;
    }

    /**
     * @function refreshVariables
     * @description Refreshes the application variables from CF
     * @public
     **/
    function refreshVariables() {

      vm.isBusy = true;
      vm.fetchError = false;
      vm.model.getAppVariables(cnsiGuid, vm.id)
        .then(function () {
          vm.fetchError = false;
          vm.variableNames = _.sortBy(
            _.keys(vm.model.application.variables.environment_json),
            function (v) {
              return v.toUpperCase();
            });
        })
        .catch(function () {
          vm.fetchError = true;
        })
        .finally(function () {
          vm.isBusy = false;
        });
    }

    /**
     * @function addVariable
     * @description Open the add variable dialog and add a new application variable
     * @public
     **/
    function addVariable() {
      cfVariablesManager.add(cnsiGuid, vm.id).then(function () {
        vm.refreshVariables();
      });
    }

    /**
     * @function editVariable
     * @description Open the edit variable dialog and edit an application variable
     * @param {string} name - the name of the variable to edit
     * @public
     **/
    function editVariable(name) {
      cfVariablesManager.edit(cnsiGuid, vm.id, name).then(function () {
        vm.refreshVariables();
      });
    }

    /**
     * @function deleteVariable
     * @description Delete an application variable
     * @param {string} name - the name of the variable to delete
     * @public
     **/
    function deleteVariable(name) {
      vm.isBusy = true;
      vm.deleteError = false;
      cfVariablesManager.delete(cnsiGuid, vm.id, name)
        .then(function () {
          vm.refreshVariables();
        })
        .catch(function () {
          vm.deleteError = name;
        })
        .finally(function () {
          vm.isBusy = false;
        });
    }
  }
})();
