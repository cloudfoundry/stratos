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
     * @function list
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Returns a list of service instances for the user
     * @param {string} user - the Stratos user
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    list: function (user) {
      return this.$http.get('/api/service-instances', {
        params: { username: user }
      });
    },

    /**
     * @function register
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Authenticate the username and password with the
     * service instance
     * @param {string} user - the Stratos user
     * @param {string} service - the service instance
     * @param {string} username - the service instance username to authenticate with
     * @param {string} password - the service instance password to authenticate with
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    register: function (user, service, username, password) {
      return this.$http.post('/api/service-instances/register', {
        username: user,
        name: service,
        service_user: username,
        service_password: password
      });
    },

    /**
     * @function unregister
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Unregister user's access from service instance
     * @param {string} user - the Stratos user
     * @param {string} service - the service instance to unregister from
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    unregister: function (user, service) {
      return this.$http.post('/api/service-instances/unregister', {
        username: user,
        name: service
      });
    }
  });

})();
