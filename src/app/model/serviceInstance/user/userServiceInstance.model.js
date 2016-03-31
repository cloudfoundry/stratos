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
   * @property {number} numRegistered - the number of user registered service instances
   * @class
   */
  function UserServiceInstance(apiManager) {
    this.apiManager = apiManager;
    this.serviceInstances = [];
    this.numRegistered = 0;
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
    connect: function (url) {
      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance.user');
      return serviceInstanceApi.connect(url);
    },

    /**
     * @function disconnect
     * @memberof app.model.serviceInstance.user.UserServiceInstance
     * @description Disconnect user from service instance
     * @param {string} url - the service instance endpoint
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    disconnect: function (url) {
      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance.user');
      return serviceInstanceApi.disconnect(url);
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
          var items = response.data.items;

          // check token expirations
          var now = (new Date()).getTime() / 1000;
          angular.forEach(items, function (item) {
            if (!_.isNil(item.expires_at)) {
              if (item.expires_at > now) {
                item.valid = true;
              } else {
                item.valid = false;
              }
            }
          });

          that.serviceInstances.length = 0;
          that.serviceInstances.push.apply(that.serviceInstances, _.sortBy(items, 'name'));
          that.numRegistered = _.sumBy(items, function (o) { return o.valid ? 1 : 0; }) || 0;
          var numCompleted = _.sumBy(items, function (o) { return o.registered ? 1 : 0; }) || 0;

          return {
            serviceInstances: that.serviceInstances,
            numCompleted: numCompleted,
            numRegistered: that.numRegistered
          };
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
    }
  });

})();
