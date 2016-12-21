(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.variables', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.variables', {
      url: '/variables',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/variables/variables.html',
      controller: ApplicationVariablesController,
      controllerAs: 'applicationVariablesCtrl'
    });
  }

  ApplicationVariablesController.$inject = [
    'app.model.modelManager',
    '$stateParams',
    'cloud-foundry.view.applications.application.variables.manager'
  ];

  /**
   * @name ApplicationVariablesController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} appVarsManager - the Application Variables Manager service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} cnsiGuid - the HCF Cluster GUID
   * @property {string} id - the application GUID
   */
  function ApplicationVariablesController(modelManager, $stateParams, appVarsManager) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.cnsiGuid = $stateParams.cnsiGuid;
    this.id = $stateParams.guid;
    this.appVarsManager = appVarsManager;

    this.variableActions = [
      {name: gettext('Edit Variable'), execute: _.bind(that.editVariable, this)},
      {name: gettext('Delete Variable'), execute: _.bind(that.deleteVariable, this)}
    ];

    this.deleteErrorMsg = gettext('An error occurred deleting this variable. Please try again.');

    this.isBusy = false;
    this.fetchError = false;
    this.deleteError = false;

    this.refreshVariables();
  }

  angular.extend(ApplicationVariablesController.prototype, {
    /**
     * @function isObject
     * @description Determine if supplied var is an object
     * @param {object} v - variable
     * @returns {boolean} Indicating if value is an object
     * @public
     **/
    isObject: function (v) {
      return angular.isObject(v);
    },

    /**
     * @function hasVariables
     * @description Determine if application has variables
     * @returns {boolean} Indicating if the application has variables
     * @public
     **/
    hasVariables: function () {
      return angular.isDefined(this.model.application.variables) &&
        angular.isDefined(this.model.application.variables.environment_json) &&
        Object.keys(this.model.application.variables.environment_json).length > 0;
    },

    /**
     * @function refreshVariables
     * @description Refreshes the application variables from HCF
     * @public
     **/
    refreshVariables: function () {
      var that = this;
      this.isBusy = true;
      this.fetchError = false;
      this.model.getAppVariables(this.cnsiGuid, this.id)
        .then(function () {
          that.fetchError = false;
          that.variableNames = _.sortBy(
            _.keys(that.model.application.variables.environment_json),
            function (v) {
              return v.toUpperCase();
            });
        }).catch(function () {
          that.fetchError = true;
        }).finally(function () {
          that.isBusy = false;
        });
    },

    /**
     * @function addVariable
     * @description Open the add variable dialog and add a new application variable
     * @public
     **/
    addVariable: function () {
      var that = this;
      this.appVarsManager.add(this.cnsiGuid, this.id).then(function () {
        that.refreshVariables();
      });
    },

    /**
     * @function editVariable
     * @description Open the edit variable dialog and edit an application variable
     * @param {string} name - the name of the variable to edit
     * @public
     **/
    editVariable: function (name) {
      var that = this;
      this.appVarsManager.edit(this.cnsiGuid, this.id, name).then(function () {
        that.refreshVariables();
      });
    },

    /**
     * @function deleteVariable
     * @description Delete an application variable
     * @param {string} name - the name of the variable to delete
     * @public
     **/
    deleteVariable: function (name) {
      var that = this;
      this.isBusy = true;
      this.deleteError = false;
      this.appVarsManager.delete(this.cnsiGuid, this.id, name)
        .then(function () {
          that.refreshVariables();
        }).catch(function () {
          that.deleteError = name;
        }).finally(function () {
          that.isBusy = false;
        });
    }
  });
})();
