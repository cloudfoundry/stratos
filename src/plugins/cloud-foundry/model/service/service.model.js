(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.service
   * @memberOf cloud-foundry.model
   * @name service
   * @description Service model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerServiceModel);

  registerServiceModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerServiceModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.service', new Service(apiManager));
  }

  /**
   * @memberof cloud-foundry.model.service
   * @name Service
   * @param {app.api.apiManager} apiManager - the service API manager
   * @property {app.api.apiManager} apiManager - the service API manager
   * @property {app.api.serviceApi} serviceApi - the service API proxy
   * @class
   */
  function Service(apiManager) {
    this.apiManager = apiManager;
    this.serviceApi = this.apiManager.retrieve('cloud-foundry.api.Services');
    this.data = {};
  }

  angular.extend(Service.prototype, {
    /**
     * @function all
     * @memberof  cloud-foundry.model.service
     * @description List all services at the model layer
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object} options - options for url building
     * @returns {promise} A promise object
     * @public
     **/
    all: function (cnsiGuid, options) {
      var that = this;
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.serviceApi.ListAllServices(options, httpConfig)
        .then(function (response) {
          return that.onAll(response.data[cnsiGuid]);
        });
    },

    /**
     * @function allServicePlans
     * @memberof cloud-foundry.model.service
     * @description LIst all service plans for service
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the service guid
     * @param {object} options - additional parameters for request
     * @returns {promise} A promise object
     * @public
     */
    allServicePlans: function (cnsiGuid, guid, options) {
      var that = this;
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.serviceApi.ListAllServicePlansForService(guid, options, httpConfig)
        .then(function (response) {
          return that.onAllServicePlans(response.data[cnsiGuid]);
        });
    },

    /**
     * @function usage
     * @memberof cloud-foundry.model.service
     * @description List the usage at the model layer
     * @param {string} guid - service guid
     * @param {object} options - options for url building
     * @returns {promise} A promise object
     * @public
     **/
    usage: function (guid, options) {
      var that = this;
      return this.serviceApi.usage(guid, options)
        .then(function (response) {
          that.onUsage(response);
        });
    },

    /**
     * @function files
     * @memberof  cloud-foundry.model.service
     * @description List the files at the model layer
     * @param {string} guid - service guid
     * @param {string} instanceIndex - the instanceIndex
     * @param {string} filepath - the filePath
     * @param {object} options - options for url building
     * @returns {promise} A promise object
     * @public
     **/
    files: function (guid, instanceIndex, filepath, options) {
      var that = this;
      return this.serviceApi.files(guid, instanceIndex, filepath, options)
        .then(function (response) {
          that.onFiles(response);
        });
    },

    /**
     * @function onAll
     * @memberof cloud-foundry.model.service
     * @description onAll handler at model layer
     * @param {string} response - the json return from the api call
     * @returns {object} The response
     * @private
     */
    onAll: function (response) {
      this.data = response.resources;
      return response.resources;
    },

    /**
     * @function onAllServicePlans
     * @memberof cloud-foundry.model.service
     * @description onAllServicePlans handler at model layer
     * @param {string} response - the JSON returned from API call
     * @returns {object} The response
     * @private
     */
    onAllServicePlans: function (response) {
      this.data.servicePlans = response.resources;
      return response.resources;
    },

    /**
     * @function onUsage
     * @memberof cloud-foundry.model.service
     * @description onUsage handler at model layer
     * @param {string} response - the return from the api call
     * @private
     */
    onUsage: function (response) {
      this.data.usage = response.data;
    },

    /**
     * @function onFiles
     * @memberof cloud-foundry.model.service
     * @description onFiles handler at model layer
     * @param {string} response - the return from the api call
     * @private
     */
    onFiles: function (response) {
      this.data.files = response.data;
    }

  });

})();
