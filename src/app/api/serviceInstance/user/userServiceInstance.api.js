(function () {
  'use strict';

  /**
   * @namespace app.api.serviceInstance.user
   * @memberof app.api.serviceInstance
   * @name user
   * @description User service instance API
   */
  angular
    .module('app.api')
    .run(registerUserServiceInstanceApi);

  registerUserServiceInstanceApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerUserServiceInstanceApi($http, apiManager) {
    apiManager.register('app.api.serviceInstance.user', new UserServiceInstanceApi($http));
  }

  /**
   * @namespace app.api.serviceInstance.user.UserServiceInstanceApi
   * @memberof app.api.serviceInstance.user
   * @name UserServiceInstanceApi
   * @param {object} $http - the Angular $http service
   * @property {object} $http - the Angular $http service
   * @class
   */
  function UserServiceInstanceApi($http) {
    this.$http = $http;
  }

  angular.extend(UserServiceInstanceApi.prototype, {
    /**
     * @function connect
     * @memberof app.api.serviceInstance.user.UserServiceInstanceApi
     * @description Connect a service instance
     * @param {string} url - the service instance endpoint
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    connect: function (url) {
      return this.$http.post('/api/service-instances/user/connect', { url: url });
    },

    /**
     * @function disconnect
     * @memberof app.api.serviceInstance.user.UserServiceInstanceApi
     * @description Disconnect user from service instance
     * @param {number} id - the service instance ID
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    disconnect: function (id) {
      return this.$http.delete('/api/service-instances/user/' + id);
    },

    /**
     * @function list
     * @memberof app.api.serviceInstance.user.UserServiceInstanceApi
     * @description Returns a list of service instances for the user
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    list: function () {
      return this.$http.get('/api/service-instances/user');
    },

    /**
     * @function register
     * @memberof app.api.serviceInstance.user.UserServiceInstanceApi
     * @description Set the service instances as registered
     * @param {array} urls - the service instance endpoints
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    register: function (urls) {
      return this.$http.post('/api/service-instances/user/register', {
        serviceInstances: urls
      });
    }
  });

})();
