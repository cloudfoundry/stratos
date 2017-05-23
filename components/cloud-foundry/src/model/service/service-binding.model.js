(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.service-binding
   * @memberOf cloud-foundry.model
   * @name serviceBinding
   * @description Service binding model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerServiceBindingModel);

  function registerServiceBindingModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.service-binding', new ServiceBinding(apiManager, modelUtils));
  }

  /**
   * @memberof cloud-foundry.model.serviceBinding
   * @name ServiceBinding
   * @param {app.api.apiManager} apiManager - the API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general hcf model helpers
   * @property {app.api.apiManager} apiManager - the API manager
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @class
   */
  function ServiceBinding(apiManager, modelUtils) {

    var model = {
      createServiceBinding: createServiceBinding,
      deleteServiceBinding: deleteServiceBinding,
      listAllServiceBindings: listAllServiceBindings
    };

    return model;

    /**
     * @function createServiceBinding
     * @memberof cloud-foundry.model.serviceBinding
     * @description Create a service binding
     * @param {string} cnsiGuid - the CNSI guid
     * @param {object} bindingSpec - the binding spec
     * @returns {promise} A promise object
     * @public
     */
    function createServiceBinding(cnsiGuid, bindingSpec) {
      return apiManager.retrieve('cloud-foundry.api.ServiceBindings')
        .CreateServiceBinding(bindingSpec, {}, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    }

    /**
     * @function deleteServiceBinding
     * @memberof  cloud-foundry.model.serviceBinding
     * @description delete a particular service binding
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - identifier of service binding
     * @param {object} params - params for url building
     * @returns {promise} A promise object
     * @public
     */
    function deleteServiceBinding(cnsiGuid, guid, params) {
      return apiManager.retrieve('cloud-foundry.api.ServiceBindings')
        .DeleteServiceBinding(guid, params, modelUtils.makeHttpConfig(cnsiGuid));
    }

    /**
     * @function listAllServiceBindings
     * @memberof  cloud-foundry.model.serviceBinding
     * @description list all service bindings
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object=} params - params for url building
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A promise object
     * @public
     */
    function listAllServiceBindings(cnsiGuid, params, paginate) {
      return apiManager.retrieve('cloud-foundry.api.ServiceBindings')
        .ListAllServiceBindings(modelUtils.makeListParams(params), modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (serviceBindings) {
          _onListAllServiceBindings(cnsiGuid, serviceBindings);
          return serviceBindings;
        });
    }

    function _onListAllServiceBindings(cnsiGuid, bindings) {
      var path = 'allServiceBindings.' + cnsiGuid;
      _.unset(model, path);
      _.forEach(bindings, function (binding) {
        _.set(model, path + '.' + binding.entity.service_instance_guid, binding);
      });
    }
  }

})();
