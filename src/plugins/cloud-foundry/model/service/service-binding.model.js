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

  registerServiceBindingModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    'cloud-foundry.model.modelUtils'
  ];

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
    this.apiManager = apiManager;
    this.modelUtils = modelUtils;
  }

  angular.extend(ServiceBinding.prototype, {

    /**
     * @function createServiceBinding
     * @memberof cloud-foundry.model.serviceBinding
     * @description Create a service binding
     * @param {string} cnsiGuid - the CNSI guid
     * @param {object} bindingSpec - the binding spec
     * @returns {promise} A promise object
     * @public
     */
    createServiceBinding: function (cnsiGuid, bindingSpec) {
      return this.apiManager.retrieve('cloud-foundry.api.ServiceBindings')
        .CreateServiceBinding(bindingSpec, {}, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    },

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
    deleteServiceBinding: function (cnsiGuid, guid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.ServiceBindings')
        .DeleteServiceBinding(guid, params, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    /**
     * @function listAllServiceBindings
     * @memberof  cloud-foundry.model.serviceBinding
     * @description list all service bindings
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object=} params - params for url building
     * @returns {promise} A promise object
     * @public
     */
    listAllServiceBindings: function (cnsiGuid, params) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.ServiceBindings')
        .ListAllServiceBindings(params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          that.onListAllServiceBindings(cnsiGuid, response.data.resources);
          return response.data.resources;
        });
    },

    onListAllServiceBindings: function (cnsiGuid, bindings) {
      var that = this;
      var path = 'allServiceBindings.' + cnsiGuid;
      _.unset(this, path);
      _.forEach(bindings, function (binding) {
        _.set(that, path + '.' + binding.entity.service_instance_guid, binding);
      });
    }
  });

})();
