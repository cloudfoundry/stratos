(function () {
  'use strict';

  /**
   * @namespace app.api
   * @memberOf app.api
   * @name app.api.serviceInstance
   * @description Service instance API
   */
  angular
    .module('app.api')
    .run(registerServiceInstanceApi);

  registerServiceInstanceApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerServiceInstanceApi($http, apiManager) {
    apiManager.register('app.api.serviceInstance', new ServiceInstanceApi($http));
  }

  /**
   * @namespace app.api
   * @memberof app.api.serviceInstance
   * @name app.api.serviceInstance.ServiceInstanceApi
   * @param {object} $http - the Angular $http service
   * @property {object} $http - the Angular $http service
   * @class
   */
  function ServiceInstanceApi($http) {
    this.$http = $http;
  }

  angular.extend(ServiceInstanceApi.prototype, {
    /**
     * @function connect
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Connect a service instance
     * @param {string} url - the service instance endpoint
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    connect: function (url) {
      return this.$http.post('/api/user-service-instances/connect', { url: url });
    },

    /**
     * @function disconnect
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Disconnect user from service instance
     * @param {string} url - the service instance endpoint
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    disconnect: function (url) {
      return this.$http.post('/api/user-service-instances/disconnect', { url: url });
    },

    /**
     * @function list
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Returns a list of service instances for the user
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    list: function () {
      return this.$http.get('/api/user-service-instances');
    },

    /**
     * @function register
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Set the service instances as registered
     * @param {array} urls - the service instance endpoints
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    register: function (urls) {
      return this.$http.post('/api/user-service-instances/register', {
        serviceInstances: urls
      });
    }
  });

})();
