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
    modelManager.register('cloud-foundry.model.application', new Application(apiManager));
  }

  /**
   * @namespace cloud-foundry.model.application.Application
   * @memberof cloud-foundry.model.application
   * @name cloud-foundry.model.application.Application
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.applicationApi} applicationApi - the application API proxy
   * @property {object} application - the currently focused application.
   * @class
   */
  function Application(apiManager) {
    this.apiManager = apiManager;
    this.applicationApi = this.apiManager.retrieve('cloud-foundry.api.Apps');
    this.data = {};
    this.application = {};
  }

  angular.extend(Application.prototype, {
    /**
     * @function all
     * @memberof  cloud-foundry.model.application
     * @description List all applications at the model layer
     * @param {string} guid application guid
     * @param {object} options options for url building
     * @returns {promise} A promise object
     * @public
     **/
    all: function (guid, options) {
      var that = this;
      return this.applicationApi.ListAllApps(guid, options)
        .then(function (response) {
          that.onAll(response);
        });
    },

    /**
     * @function usage
     * @memberof cloud-foundry.model.application
     * @description List the usage at the model layer
     * @param {string} guid application guid
     * @param {object} options options for url building
     * @returns {promise} A promise object
     * @public
     **/
    usage: function (guid, options) {
      var that = this;
      return this.applicationApi.GetDetailedStatsForStartedApp(guid, options)
        .then(function (response) {
          that.onUsage(response);
        });
    },

    /**
     * @function files
     * @memberof  cloud-foundry.model.application
     * @description List the files at the model layer
     * @param {string} guid application guid
     * @param {string} instanceIndex the instanceIndex
     * @param {string} filepath the filePath
     * @param {object} options options for url building
     * @returns {promise} A promise object
     * @public
     **/
    files: function (guid, instanceIndex, filepath, options) {
      var that = this;
      return this.applicationApi.files(guid, instanceIndex, filepath, options)
        .then(function (response) {
          that.onFiles(response);
        });
    },

    /**
     * @function getAppSummary
     * @memberof cloud-foundry.model.application
     * @description get summary of an application at the model layer
     * @param {string} guid - the application id
     * @returns {promise}
     * @public
     */
    getAppSummary: function (guid) {
      return this.apiManager.retrieve('cloud-foundry.api.Apps')
        .GetAppSummary(guid)
        .then(this.onSummary.bind(this));
    },

    /**
     * @function onAll
     * @memberof  cloud-foundry.model.application
     * @description onAll handler at model layer
     * @param {string} response the json return from the api call
     * @private
     * @returns {void}
     */
    onAll: function (response) {
      this.data.applications = response.data;
    },

    /**
     * @function onUsage
     * @memberof  cloud-foundry.model.application
     * @description onUsage handler at model layer
     * @param {string} response the return from the api call
     * @private
     * @returns {void}
     */
    onUsage: function (response) {
      this.data.usage = response.data;
    },

    /**
     * @function onFiles
     * @memberof  cloud-foundry.model.application
     * @description onFiles handler at model layer
     * @parameter {string} response the return from the api call
     * @property data - the return data from the api call
     * @private
     * @returns {void}
     */
    onFiles: function (response) {
      this.data.files = response.data;
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
      this.application.summary = response.data;
    }

  });

})();
