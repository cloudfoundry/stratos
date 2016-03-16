(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.application
   * @memberOf cloud-foundry.model
   * @name application
   * @description Application model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerApplicationModel);

  registerApplicationModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerApplicationModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.application', new ApplicationModel(apiManager));
  }

  /**
   * @namespace cloud-foundry.model.application.Application
   * @memberof cloud-foundry.model.application
   * @name cloud-foundry.model.application.Application
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {array} applications - applications
   * @property {object} summary - summary of selected application
   * @class
   */
  function ApplicationModel(apiManager) {
    this.apiManager = apiManager;
    this.applications = null;
    this.summary = null;
  }

  angular.extend(ApplicationModel.prototype, {
    /**
     * @function all
     * @memberof  cloud-foundry.model.application
     * @description List all applications at the model layer
     * @returns {promise}
     * @public
     */
    all: function () {
      return this.apiManager.retrieve('cloud-foundry.api.application')
        .all()
        .then(this.onAll.bind(this));
    },

    /**
     * @function summary
     * @memberof cloud-foundry.model.application
     * @description get summary of an application at the model layer
     * @param {string} guid - the application id
     * @returns {promise}
     * @public
     */
    summary: function (guid) {
      return this.apiManager.retrieve('cloud-foundry.api.application')
        .summary(guid)
        .then(this.onSummary.bind(this));
    },
    /**
     * @function onAll
     * @memberof  cloud-foundry.model.application
     * @description onAll handler at model layer
     * @param {object} response - the json return from the api call
     * @private
     * @returns {void}
     */
    onAll: function (response) {
      this.applications = response.data.resources;
    },

    /**
     * @function onSummary
     * @memberof  cloud-foundry.model.application
     * @description onSummary handler at model layer
     * @param {object} response - the json return from the api call
     * @private
     * @returns {void}
     */
    onSummary: function (response) {
      this.summary = response.data;
    }

  });

})();
