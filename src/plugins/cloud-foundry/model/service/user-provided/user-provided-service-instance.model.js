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

  registerUserProvidedServiceInstanceModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    'cloud-foundry.model.modelUtils'
  ];

  function registerUserProvidedServiceInstanceModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.user-provided-service-instance',
      new UserProvidedServiceInstance(apiManager, modelUtils));
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
  function UserProvidedServiceInstance(apiManager, modelUtils) {
    this.userProvidedServiceInstance = apiManager.retrieve('cloud-foundry.api.UserProvidedServiceInstances');
    this.modelUtils = modelUtils;
  }

  angular.extend(UserProvidedServiceInstance.prototype, {

    /**
     * @function getUserProvidedServiceInstance
     * @memberof cloud-foundry.model.user-provided-service-instance.UserProvidedServiceInstance
     * @description Gets the metadata for the specified user provided service instance
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the user provided service instance guid
     * @returns {promise} A promise object
     */
    getUserProvidedServiceInstance: function (cnsiGuid, guid) {
      return this.userProvidedServiceInstance.RetrieveUserProvidedServiceInstance(guid, {},
        this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    },

    /**
     * @function listAllServiceBindings
     * @memberof cloud-foundry.model.user-provided-service-instance.UserProvidedServiceInstance
     * @description List all service bindings
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the user provided service instance guid
     * @returns {promise} A promise object
     */
    listAllServiceBindings: function (cnsiGuid, guid) {
      return this.userProvidedServiceInstance.ListAllServiceBindingsForUserProvidedServiceInstance(guid, {},
        this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    /**
     * @function deleteUserProvidedServiceInstance
     * @memberof cloud-foundry.model.user-provided-service-instance.UserProvidedServiceInstance
     * @description Delete user provided service instance
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the user provided service instance guid
     * @returns {promise} A promise object
     */
    deleteUserProvidedServiceInstance: function (cnsiGuid, guid) {
      return this.userProvidedServiceInstance.DeleteUserProvidedServiceInstance(guid, {},
        this.modelUtils.makeHttpConfig(cnsiGuid));
    }
  });

})();
