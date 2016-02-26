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
    'app.api.apiManager',
    'app.model.modelManager'
  ];

  function registerServiceInstanceModel(apiManager, modelManager) {
    modelManager.register('app.model.serviceInstance', new ServiceInstance(apiManager, modelManager));
  }

  /**
   * @namespace app.model.serviceInstance.ServiceInstance
   * @memberof app.model.serviceInstance
   * @name app.model.serviceInstance.ServiceInstance
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {app.model.account} account - the account model
   * @property {app.api.serviceInstance} serviceInstanceApi - the service instance API
   * @property {array} serviceInstances - the service instances for the logged in user
   * @class
   */
  function ServiceInstance(apiManager, modelManager) {
    this.apiManager = apiManager;
    this.account = modelManager.retrieve('app.model.account');
    this.serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance');
    this.serviceInstances = [];
  }

  angular.extend(ServiceInstance.prototype, {
    /**
     * @function list
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Returns a list of service instances for the user
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    list: function () {
      var that = this;
      return this.serviceInstanceApi.list(this.account.user)
        .then(function (response) {
          that.serviceInstances = response.data;
        });
    },

    /**
     * @function list
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Authenticate the username and password with the
     * service instance
     * @param {string} service - the service instance
     * @param {string} username - the service instance username to authenticate with
     * @param {string} password - the service instance password to authenticate with
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    register: function (service, username, password) {
      return this.serviceInstanceApi.register(this.account.user, service, username, password);
    },

    /**
     * @function revoke
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Revoke user's access from service instance
     * @param {string} service - the service instance to revoke access from
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    revoke: function (service) {
      return this.serviceInstanceApi.revoke(this.account.user, service);
    }
  });

})();
