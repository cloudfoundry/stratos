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
    '$stateParams'
  ];

  /**
   * @name ApplicationVariablesController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationVariablesController(modelManager, $stateParams) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.cnsiGuid = $stateParams.cnsiGuid;
    this.id = $stateParams.guid;

    this.isFetching = false;
    this.fetchError = false;

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
    isObject: function(v) {
      return angular.isObject(v);
    },

    /**
     * @function hasVariables
     * @description Determine if application has variables
     * @returns {boolean} Indicating if the application has vaiables
     * @public
     **/
    hasVariables: function() {
      return angular.isDefined(this.model.application.variables) &&
        angular.isDefined(this.model.application.variables.environment_json) &&
        Object.keys(this.model.application.variables.environment_json).length > 0;
    },

    /**
     * @function refreshVariables
     * @description Refreshes the application variables from HCF
     * @public
     **/
    refreshVariables: function() {
      var that = this;
      this.isFetching = true;
      this.fetchError = false;
      this.model.getAppVariables(this.cnsiGuid, this.id)
        .then(function () {
          that.fetchError = false;
          that.variableNames = _.sortBy(
            _.keys(that.model.application.variables.environment_json),
            function (v) { return v.toUpperCase() });
        }).catch(function () {
          // Failed to get the application variables
          that.fetchError = true;
      }).finally(function () {
        that.isFetching = false;
      })
    }
  });

})();
