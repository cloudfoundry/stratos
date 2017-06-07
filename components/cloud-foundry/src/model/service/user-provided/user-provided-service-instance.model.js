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
    .run(registerUserProvidedServiceInstanceModel);

  function registerUserProvidedServiceInstanceModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.user-provided-service-instance',
      new UserProvidedServiceInstance(apiManager, modelUtils));
  }

  /**
   * @memberof cloud-foundry.model.service-instance
   * @name ServiceInstance
   * @param {app.api.apiManager} apiManager - the API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general cf model helpers
   * @property {app.api.apiManager} apiManager - the API manager
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general cf model helpers
   * @property {object} data - the data holder
   * @class
   */
  function UserProvidedServiceInstance(apiManager, modelUtils) {
    var userProvidedServiceInstance = apiManager.retrieve('cloud-foundry.api.UserProvidedServiceInstances');

    return {
      getUserProvidedServiceInstance: getUserProvidedServiceInstance,
      listAllServiceBindings: listAllServiceBindings,
      deleteUserProvidedServiceInstance: deleteUserProvidedServiceInstance
    };

    /**
     * @function getUserProvidedServiceInstance
     * @memberof cloud-foundry.model.user-provided-service-instance.UserProvidedServiceInstance
     * @description Gets the metadata for the specified user provided service instance
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the user provided service instance guid
     * @returns {promise} A promise object
     */
    function getUserProvidedServiceInstance(cnsiGuid, guid) {
      return userProvidedServiceInstance.RetrieveUserProvidedServiceInstance(guid, {},
        modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    }

    /**
     * @function listAllServiceBindings
     * @memberof cloud-foundry.model.user-provided-service-instance.UserProvidedServiceInstance
     * @description List all service bindings
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the user provided service instance guid
     * @returns {promise} A promise object
     */
    function listAllServiceBindings(cnsiGuid, guid) {
      return userProvidedServiceInstance.ListAllServiceBindingsForUserProvidedServiceInstance(guid, {},
        modelUtils.makeHttpConfig(cnsiGuid));
    }

    /**
     * @function deleteUserProvidedServiceInstance
     * @memberof cloud-foundry.model.user-provided-service-instance.UserProvidedServiceInstance
     * @description Delete user provided service instance
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the user provided service instance guid
     * @returns {promise} A promise object
     */
    function deleteUserProvidedServiceInstance(cnsiGuid, guid) {
      return userProvidedServiceInstance.DeleteUserProvidedServiceInstance(guid, {},
        modelUtils.makeHttpConfig(cnsiGuid));
    }
  }

})();
