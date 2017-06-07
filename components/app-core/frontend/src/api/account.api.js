(function () {
  'use strict';

  /**
   * @namespace app.api
   * @memberOf app.api
   * @name app.api.account
   * @description Account access API
   */
  angular
    .module('app.api')
    .run(registerAccountApi);

  function registerAccountApi($http, $httpParamSerializer, apiManager) {
    apiManager.register('app.api.account', new AccountApi($http, $httpParamSerializer));
  }

  /**
   * @namespace app.api
   * @memberof app.api
   * @name app.api.account
   * @param {object} $http - the Angular $http service
   * @param {object} $httpParamSerializer - the Angular $httpParamSerializer service
   * @property {object} $http - the Angular $http service
   * @property {object} $httpParamSerializer - the Angular $httpParamSerializer service
   * @class
   */
  function AccountApi($http, $httpParamSerializer) {

    return {
      login: login,
      logout: logout,
      verifySession: verifySession,
      userInfo: userInfo
    };

    /**
     * @function login
     * @memberof app.api.account.AccountApi
     * @param {string} username - the username
     * @param {string} password - the password
     * @description Log in of the application at model layer
     * @returns {object} A resolved/rejected promise
     * @public
     */
    function login(username, password) {
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      var data = $httpParamSerializer({ username: username, password: password });
      return $http.post('/pp/v1/auth/login/uaa', data, config);
    }

    /**
     * @function logout
     * @memberof app.api.account.AccountApi
     * @description Log out at API layer, send XHR.
     * @returns {object} A resolved/rejected promise
     * @public
     */
    function logout() {
      return $http.post('/pp/v1/auth/logout');
    }

    /**
     * @function verifySession
     * @memberof app.api.account.AccountApi
     * @description Verify validation of the session with cookie.
     * @returns {object} A resolved/rejected promise
     * @public
     */
    function verifySession() {
      return $http.get('/pp/v1/auth/session/verify');
    }

    function userInfo() {
      return $http.get('/pp/v1/userinfo');
    }

  }

})();
