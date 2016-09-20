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
    '$httpParamSerializer',
    'app.api.apiManager'
  ];

  function registerUserServiceInstanceApi($http, $httpParamSerializer, apiManager) {
    apiManager.register('app.api.serviceInstance.user',
      new UserServiceInstanceApi($http, $httpParamSerializer));
  }

  /**
   * @namespace app.api.serviceInstance.user.UserServiceInstanceApi
   * @memberof app.api.serviceInstance.user
   * @name UserServiceInstanceApi
   * @param {object} $http - the Angular $http service
   * @param {object} $httpParamSerializer - the Angular $httpParamSerializer service
   * @property {object} $http - the Angular $http service
   * @property {object} $httpParamSerializer - the Angular $httpParamSerializer service
   * @class
   */
  function UserServiceInstanceApi($http, $httpParamSerializer) {
    this.$http = $http;
    this.$httpParamSerializer = $httpParamSerializer;
  }

  angular.extend(UserServiceInstanceApi.prototype, {
    /**
     * @function connect
     * @memberof app.api.serviceInstance.user.UserServiceInstanceApi
     * @description Connect a service instance
     * @param {string} guid - the CNSI guid
     * @param {string} username - the login username
     * @param {string} password - the login password
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    connect: function (guid, username, password) {
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      var loginData = {
        cnsi_guid: guid,
        username: username,
        password: password
      };
      var data = this.$httpParamSerializer(loginData);

      return this.$http.post('/pp/v1/auth/login/cnsi', data, config);
    },

    /**
     * @function disconnect
     * @memberof app.api.serviceInstance.user.UserServiceInstanceApi
     * @description Disconnect user from service instance
     * @param {number} guid - the service instance ID
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    disconnect: function (guid) {
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      var disconnectData = {cnsi_guid: guid};
      var data = this.$httpParamSerializer(disconnectData);
      /* eslint-disable */
      // TODO(woodnt): This should likely be a delete.  We should investigate the Portal-proxy urls and verbs. https://jira.hpcloud.net/browse/TEAMFOUR-620
      /* eslint-enable */
      return this.$http.post('/pp/v1/auth/logout/cnsi', data, config);
    },

    /**
     * @function list
     * @memberof app.api.serviceInstance.user.UserServiceInstanceApi
     * @description Returns a list of registered CNSIs for the user
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    list: function () {
      return this.$http.get('/pp/v1/cnsis/registered');
    }
  });

})();
