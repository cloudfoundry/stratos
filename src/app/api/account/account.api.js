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
    '$httpParamSerializer',
    '$q',
    '$cookies',
    'app.api.apiManager'
  ];

  function registerAccountApi($http, $httpParamSerializer, $q, $cookies, apiManager) {
    apiManager.register('app.api.account', new AccountApi($http, $httpParamSerializer, $q, $cookies));
  }

  /**
   * @namespace app.api
   * @memberof app.api
   * @name app.api.account
   * @param {object} $http - the Angular $http service
   * @param {object} $httpParamSerializer - the Angular $httpParamSerializer service
   * @param {object} $q - the Angular Promise service
   * @param {object} $cookies - the Angular cookies service
   * @property {object} $http - the Angular $http service
   * @property {object} $httpParamSerializer - the Angular $httpParamSerializer service
   * @property {object} $q - the Angular Promise service
   * @property {object} $cookies - the Angular cookies service
   * @class
   */
  function AccountApi($http, $httpParamSerializer, $q, $cookies) {
    this.$http = $http;
    this.$httpParamSerializer = $httpParamSerializer;
    this.$q = $q;
    this.$cookies = $cookies;
    this.sessionName = 'stackato-console-session';
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
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      var data = this.$httpParamSerializer({ username: username, password: password });
      return this.$http.post('/pp/v1/auth/login/uaa', data, config);
    },

    /**
     * @function logout
     * @memberof app.api.account.AccountApi
     * @description Log out at API layer, send XHR.
     * @returns {object} A resolved/rejected promise
     * @public
     */
    logout: function () {
      return this.$http.post('/pp/v1/auth/logout');
    },

    /**
     * @function verifySession
     * @memberof app.api.account.AccountApi
     * @description Verify validation of the session with cookie.
     * @returns {object} A resolved/rejected promise
     * @public
     */
    verifySession: function () {
      if (this.$cookies.get(this.sessionName)) {
        return this.$http.get('/pp/v1/auth/session/verify');
      }
      return this.$q.reject(this.sessionName + ' cookie missing!');
    },

    /**
     * @function hasSessionCookie
     * @memberof app.api.account.AccountApi
     * @description Check if the user has a session cookie
     * @returns {boolean} Indicates if a session cookie exists
     * @public
     */
    hasSessionCookie: function () {
      return this.$cookies.get(this.sessionName);
    },

    userInfo: function () {
      if (this.$cookies.get(this.sessionName)) {
        return this.$http.get('/pp/v1/userinfo');
      }
      return this.$q.reject(this.sessionName + ' cookie missing!');
    }

  });

})();
