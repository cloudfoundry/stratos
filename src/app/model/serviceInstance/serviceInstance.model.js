(function () {
  'use strict';

  /**
   * @namespace app.model.serviceInstance
   * @memberOf app.model
   * @name serviceInstance
   * @description Service instance model
   */
  angular
    .module('app.model')
    .run(registerServiceInstanceModel);

  registerServiceInstanceModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerServiceInstanceModel(modelManager, apiManager) {
    modelManager.register('app.model.serviceInstance', new ServiceInstance(apiManager));
  }

  /**
   * @namespace app.model.serviceInstance.ServiceInstance
   * @memberof app.model.serviceInstance
   * @name app.model.serviceInstance.ServiceInstance
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.serviceInstance} serviceInstanceApi - the service instance API
   * @class
   */
  function ServiceInstance(apiManager) {
    this.apiManager = apiManager;
    this.serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance');
  }

  angular.extend(ServiceInstance.prototype, {
    /**
     * @function list
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Returns a list of service instances for the user
     * @param {string} user - the Stratos user
     * @returns {object} A resolved/rejected promise
     * @public
     */
    list: function (user) {
      return this.serviceInstanceApi.list(user);
    },

    /**
     * @function list
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Authenticate the username and password with the
     * service instance
     * @param {string} user - the Stratos user
     * @param {string} service - the service instance
     * @param {string} username - the service instance username to authenticate with
     * @param {string} password - the service instance password to authenticate with
     * @returns {object} A resolved/rejected promise
     * @public
     */
    register: function (user, service, username, password) {
      return this.serviceInstanceApi.register(user, service, username, password);
    },

    /**
     * @function revoke
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Revoke user's access from service instance
     * @param {string} user - the Stratos user
     * @param {string} service - the service instance to revoke access from
     * @returns {object} A resolved/rejected promise
     * @public
     */
    revoke: function (user, service) {
      return this.serviceInstanceApi.revoke(user, service);
    }
  });

})();
