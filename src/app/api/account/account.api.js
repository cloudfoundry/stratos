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

  registerAccountApi.$inject = [
    '$http',
    '$q',
    '$cookies',
    'app.api.apiManager'
  ];

  function registerAccountApi($http, $q, $cookies, apiManager) {
    apiManager.register('app.api.account', new AccountApi($http, $q, $cookies));
  }

  /**
   * @namespace app.api
   * @memberof app.api.account
   * @name app.model.account.AccountApi
   * @param {object} $http - the Angular $http service
   * @param {object} $q - the Angular Promise service
   * @param {object} $cookies - the Angular cookies service
   * @property {object} $http - the Angular $http service
   * @property {object} $q - the Angular Promise service
   * @property {object} $cookies - the Angular cookies service
   * @class
   */
  function AccountApi($http, $q, $cookies) {
    this.$http = $http;
    this.$q = $q;
    this.$cookies = $cookies;
  }

  angular.extend(AccountApi.prototype, {
    /**
     * @function login
     * @memberof app.api.account.AccountApi
     * @param {string} username - the username
     * @param {string} password - the password
     * @description Log in of the application at model layer
     * @returns {object} A resolved/rejected promise
     * @public
     */
    login: function (username, password) {
      return this.$http.post('/api/auth/login/', {
        username: username,
        password: password
      });
    },

    /**
     * @function logout
     * @memberof app.api.account.AccountApi
     * @description Log out at API layer, send XHR.
     * @returns {object} A resolved/rejected promise
     * @public
     */
    logout: function () {
      return this.$http.get('/api/auth/logout');
    },

    /**
     * @function verifySession
     * @memberof app.api.account.AccountApi
     * @description Verify validation of the session with cookie.
     * @returns {object} A resolved/rejected promise
     * @public
     */
    verifySession: function () {
      if (this.$cookies.get('session_id')) {
        return this.$http.get('/api/auth/verify-session');
      }
      return this.$q(function(resolve, reject) {
        reject({});
      });
    }
  });

})();
