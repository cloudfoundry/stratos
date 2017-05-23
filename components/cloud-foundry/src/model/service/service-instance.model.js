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
    var serviceInstanceApi = apiManager.retrieve('cloud-foundry.api.ServiceInstances');

    var model = {
      data: {},
      all: all,
      createServiceInstance: createServiceInstance,
      deleteServiceInstance: deleteServiceInstance,
      listAllServiceBindingsForServiceInstance: listAllServiceBindingsForServiceInstance,
      onAll: onAll
    };

    return model;

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
    function all(cnsiGuid, options, paginate) {

      return serviceInstanceApi.ListAllServiceInstances(modelUtils.makeListParams(options),
        modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (all) {
          return onAll(all);
        });
    }

    /**
     * @function createServiceInstance
     * @memberof cloud-foundry.model.service-instance.ServiceInstance
     * @description Create a service instance
     * @param {string} cnsiGuid - the CNSI guid
     * @param {object} newInstanceSpec - the service instance spec
     * @returns {promise} A promise object
     * @public
     */
    function createServiceInstance(cnsiGuid, newInstanceSpec) {
      return serviceInstanceApi.CreateServiceInstance(newInstanceSpec, {},
        modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    }

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
    function deleteServiceInstance(cnsiGuid, serviceInstanceGuid, params) {
      return serviceInstanceApi.DeleteServiceInstance(serviceInstanceGuid, params,
        modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    }

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
    function listAllServiceBindingsForServiceInstance(cnsiGuid, guid, params, paginate) {

      return serviceInstanceApi.ListAllServiceBindingsForServiceInstance(guid,
        modelUtils.makeListParams(params),
        modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    }

    /**
     * @function onAll
     * @memberof cloud-foundry.model.service-instance.ServiceInstance
     * @description onAll handler at model layer
     * @param {Array} all - the JSON collection returned from API call
     * @returns {Array} The JSON collection returned from API call
     * @private
     */
    function onAll(all) {
      model.data = all;
      return all;
    }
  }

})();
