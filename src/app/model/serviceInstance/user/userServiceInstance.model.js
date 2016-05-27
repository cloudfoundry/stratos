(function () {
  'use strict';

  /**
   * @namespace app.model.serviceInstance.user
   * @memberOf app.model.serviceInstance
   * @name user
   * @description User service instance model
   */
  angular
    .module('app.model')
    .run(registerUserServiceInstanceModel);

  registerUserServiceInstanceModel.$inject = [
    'app.api.apiManager',
    'app.model.modelManager'
  ];

  function registerUserServiceInstanceModel(apiManager, modelManager) {
    modelManager.register('app.model.serviceInstance.user', new UserServiceInstance(apiManager));
  }

  /**
   * @namespace app.model.serviceInstance.user.UserServiceInstance
   * @memberof app.model.serviceInstance.user
   * @name app.model.serviceInstance.user.UserServiceInstance
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {array} serviceInstances - the service instances available to user
   * @property {number} numValid - the number of valid user service instances
   * @class
   */
  function UserServiceInstance(apiManager) {
    this.apiManager = apiManager;
    this.serviceInstances = {};
    this.numValid = 0;
  }

  angular.extend(UserServiceInstance.prototype, {
    /**
     * @function connect
     * @memberof app.api.serviceInstance.user.UserServiceInstance
     * @description Connect a service instance
     * @param {string} url - the service instance endpoint
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    connect: function (guid, name, username, password) {
      var that = this;
      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance.user');
      return serviceInstanceApi.connect(guid, username, password)
        .then(function (response) {
          that.onConnect(guid, name, response);
          return response;
        });
    },

    /**
     * @function disconnect
     * @memberof app.model.serviceInstance.user.UserServiceInstance
     * @description Disconnect user from service instance
     * @param {number} id - the service instance ID
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    disconnect: function (id) {
      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance.user');
      return serviceInstanceApi.disconnect(id);
    },

    /**
     * @function list
     * @memberof app.model.serviceInstance.user.UserServiceInstance
     * @description Returns services instances and number registered
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    list: function () {
      var that = this;
      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance.user');
      return serviceInstanceApi.list()
        .then(function (response) {
          var items = response.data;

          // check token expirations
          var now = (new Date()).getTime() / 1000;
          angular.forEach(items, function (item) {
            if (!_.isNil(item.TokenExpiry)) {
              item.valid = item.TokenExpiry > now;
            }
          });

          that.serviceInstances = _.keyBy(items, 'Name');
          that.numValid = _.sumBy(items, function (o) { return o.valid ? 1 : 0; }) || 0;

          return that.serviceInstances;
        });
    },

    /**
     * @function register
     * @memberof app.model.serviceInstance.user.UserServiceInstance
     * @description Set the service instances as registered
     * @param {array} urls - the service instance endpoints
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    register: function (urls) {
      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance.user');
      return serviceInstanceApi.register(urls);
    },

    onConnect: function (guid, name, response) {
      var newCnsi = response.data;
      var data = { GUID: guid, Name: name, TokenExpiry: newCnsi.token_expiry, Account: newCnsi.username, APIEndpoint: newCnsi.api_endpoint };
      if (angular.isUndefined(this.serviceInstances[name])) {
        this.serviceInstances[name] = data;
      } else {
        angular.extend(this.serviceInstances[name], data);
      }
    }
  });

})();
