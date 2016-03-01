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
   * @property {array} serviceInstances - the service instances available to user
   * @property {number} numRegistered - the number of user registered service instances
   * @class
   */
  function ServiceInstance(apiManager, modelManager) {
    this.apiManager = apiManager;
    this.account = modelManager.retrieve('app.model.account');
    this.serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance');
    this.serviceInstances = [];
    this.numRegistered = 0;
  }

  angular.extend(ServiceInstance.prototype, {
    /**
     * @function list
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Returns services instances and number registered
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    list: function () {
      var that = this;
      return this.serviceInstanceApi.list(that.account.username)
        .then(function (response) {
          var items = response.data.items;
          that.serviceInstances.length = 0;
          that.serviceInstances.push.apply(that.serviceInstances, _.sortBy(items, 'name'));
          that.numRegistered = _.sumBy(items, function (o) { return o.registered ? 1 : 0; }) || 0;
          return { serviceInstances: that.serviceInstances, numRegistered: that.numRegistered };
        });
    },

    /**
     * @function list
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Authenticate the username and password with the
     * service instance
     * @param {string} serviceInstance - the service instance name
     * @param {string} username - the service instance username to authenticate with
     * @param {string} password - the service instance password to authenticate with
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    register: function (serviceInstance, username, password) {
      return this.serviceInstanceApi.register(this.account.username, serviceInstance, username, password);
    },

    /**
     * @function unregister
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Unregister user from service instance
     * @param {string} serviceInstance - the service instance name
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    unregister: function (serviceInstance) {
      return this.serviceInstanceApi.unregister(this.account.username, serviceInstance);
    }
  });

})();
