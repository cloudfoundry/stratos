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
    'app.api.apiManager'
  ];

  function registerUserProvidedServiceInstanceModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.user-provided-service-instance', new UserProvidedServiceInstance(apiManager));
  }

  /**
   * @memberof cloud-foundry.model.service-instance
   * @name ServiceInstance
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @property {object} data - the data holder
   * @class
   */
  function UserProvidedServiceInstance(apiManager) {
    this.userProvidedServiceInstance = apiManager.retrieve('cloud-foundry.api.UserProvidedServiceInstances');
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
      var httpConfig = {
        headers: {
          'x-cnap-cnsi-list': cnsiGuid,
          'x-cnap-passthrough': 'true'
        }
      };

      return this.userProvidedServiceInstance.RetrieveUserProvidedServiceInstance(guid, {}, httpConfig)
        .then(function (response) {
          return response.data;
        });
    }
  });

})();
