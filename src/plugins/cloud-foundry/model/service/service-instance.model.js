(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.service-instance
   * @memberof cloud-foundry.model
   * @name service-instance
   * @description Service instance model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerServiceInstanceModel);

  registerServiceInstanceModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    'cloud-foundry.model.modelUtils'
  ];

  function registerServiceInstanceModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.service-instance', new ServiceInstance(apiManager, modelUtils));
  }

  /**
   * @memberof cloud-foundry.model.service-instance
   * @name ServiceInstance
   * @param {app.api.apiManager} apiManager - the API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general hcf model helpers
   * @property {app.api.apiManager} apiManager - the API manager
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @property {object} data - the data holder
   * @class
   */
  function ServiceInstance(apiManager, modelUtils) {
    this.serviceInstanceApi = apiManager.retrieve('cloud-foundry.api.ServiceInstances');
    this.modelUtils = modelUtils;
    this.data = {};
  }

  angular.extend(ServiceInstance.prototype, {
    /**
     * @function all
     * @memberof cloud-foundry.model.service-instance.ServiceInstance
     * @description List all service instances
     * @param {string} cnsiGuid - the CNSI guid
     * @param {object} options - the additional parameters for request
     * @returns {promise} A promise object
     * @public
     */
    all: function (cnsiGuid, options) {
      var that = this;
      return this.serviceInstanceApi.ListAllServiceInstances(options, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return that.onAll(response.data);
        });
    },

    /**
     * @function createServiceInstance
     * @memberof cloud-foundry.model.service-instance.ServiceInstance
     * @description Create a service instance
     * @param {string} cnsiGuid - the CNSI guid
     * @param {object} newInstanceSpec - the service instance spec
     * @returns {promise} A promise object
     * @public
     */
    createServiceInstance: function (cnsiGuid, newInstanceSpec) {
      return this.serviceInstanceApi.CreateServiceInstance(newInstanceSpec, {},
        this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    },

    /**
     * @function deleteServiceInstance
     * @memberof cloud-foundry.model.service-instance.ServiceInstance
     * @description Delete a service instance. This includes all service bindings, service keys and routes associated
     * with the service instance
     * @param {string} cnsiGuid - the CNSI guid
     * @param {object} serviceInstanceGuid - the service instance guid of the service instance to delete
     * @param {object} params - additional params to pass to request
     * @returns {promise} A promise object
     * @public
     */
    deleteServiceInstance: function (cnsiGuid, serviceInstanceGuid, params) {
      return this.serviceInstanceApi.DeleteServiceInstance(serviceInstanceGuid, params,
        this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    },

    /**
     * @function listAllServiceBindingsForServiceInstance
     * @memberof cloud-foundry.model.service-instance.ServiceInstance
     * @description List all service bindings for a service instance
     * @param {string} cnsiGuid - the CNSI guid
     * @param {object} guid - the service instance guid
     * @returns {promise} A promise object
     * @public
     */
    listAllServiceBindingsForServiceInstance: function (cnsiGuid, guid) {
      return this.serviceInstanceApi.ListAllServiceBindingsForServiceInstance(guid, {},
        this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    /**
     * @function onAll
     * @memberof cloud-foundry.model.service-instance.ServiceInstance
     * @description onAll handler at model layer
     * @param {string} response - the JSON returned from API call
     * @returns {object} The response
     * @private
     */
    onAll: function (response) {
      this.data = response.resources;
      return response.resources;
    }
  });

})();
