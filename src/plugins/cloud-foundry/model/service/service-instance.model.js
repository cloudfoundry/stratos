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
    'modelManager',
    'apiManager',
    'modelUtils'
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
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A promise object
     * @public
     */
    all: function (cnsiGuid, options, paginate) {
      var that = this;
      return this.serviceInstanceApi.ListAllServiceInstances(this.modelUtils.makeListParams(options),
        this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (all) {
          return that.onAll(all);
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
     * @param {object} params - optional parameters
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A promise object
     * @public
     */
    listAllServiceBindingsForServiceInstance: function (cnsiGuid, guid, params, paginate) {
      var that = this;
      return this.serviceInstanceApi.ListAllServiceBindingsForServiceInstance(guid,
        this.modelUtils.makeListParams(params),
        this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    },

    /**
     * @function onAll
     * @memberof cloud-foundry.model.service-instance.ServiceInstance
     * @description onAll handler at model layer
     * @param {Array} all - the JSON collection returned from API call
     * @returns {Array} The JSON collection returned from API call
     * @private
     */
    onAll: function (all) {
      this.data = all;
      return all;
    }
  });

})();
