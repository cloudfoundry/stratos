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
    'app.api.apiManager'
  ];

  function registerServiceBindingModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.service-binding', new ServiceBinding(apiManager));
  }

  /**
   * @memberof cloud-foundry.model.serviceBinding
   * @name ServiceBinding
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @class
   */
  function ServiceBinding(apiManager) {
    this.apiManager = apiManager;
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
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.apiManager.retrieve('cloud-foundry.api.ServiceBindings')
        .CreateServiceBinding(bindingSpec, {}, httpConfig)
        .then(function (response) {
          return response.data[cnsiGuid];
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
     **/
    deleteServiceBinding: function (cnsiGuid, guid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.ServiceBindings')
        .DeleteServiceBinding(guid, params);
    },

    /**
     * @function listAllServiceBindings
     * @memberof  cloud-foundry.model.serviceBinding
     * @description list all service bindings
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object} params - params for url building
     * @returns {promise} A promise object
     * @public
     **/
    listAllServiceBindings: function (cnsiGuid, params) {
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.apiManager.retrieve('cloud-foundry.api.ServiceBindings')
        .ListAllServiceBindings(params, httpConfig)
        .then(function (response) {
          return response.data[cnsiGuid].resources;
        });
    }
  });

})();
