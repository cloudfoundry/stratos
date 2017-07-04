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

    return {
      connect: connect,
      verify: verify,
      disconnect: disconnect,
      list: list
    };

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
    function connect(guid, username, password) {
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
      var data = $httpParamSerializer(loginData);

      return $http.post('/pp/v1/auth/login/cnsi', data, config);
    }

    /**
     * @function verify
     * @memberof app.api.serviceInstance.user.UserServiceInstanceApi
     * @description Verify credentials provided by user
     * @param {string} guid - the CNSI guid
     * @param {string} username - the login username
     * @param {string} password - the login password
     * @returns {promise}
     * @public
     */
    function verify(guid, username, password) {
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
      var data = $httpParamSerializer(loginData);

      return $http.post('/pp/v1/auth/login/cnsi/verify', data, config);
    }

    /**
     * @function disconnect
     * @memberof app.api.serviceInstance.user.UserServiceInstanceApi
     * @description Disconnect user from service instance
     * @param {number} guid - the service instance ID
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function disconnect(guid) {
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      var disconnectData = {cnsi_guid: guid};
      var data = $httpParamSerializer(disconnectData);
      /* eslint-disable */
      // TODO(woodnt): This should likely be a delete.  We should investigate the Portal-proxy urls and verbs.
      /* eslint-enable */
      return $http.post('/pp/v1/auth/logout/cnsi', data, config);
    }

    /**
     * @function list
     * @memberof app.api.serviceInstance.user.UserServiceInstanceApi
     * @description Returns a list of registered CNSIs for the user
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function list() {
      return $http.get('/pp/v1/cnsis/registered');
    }
  }

})();
