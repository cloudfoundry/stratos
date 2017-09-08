(function () {
  'use strict';

  /**
   * @namespace app.model.account
   * @memberOf app.model
   * @name account
   * @description Account model
   */
  angular
    .module('app.model')
    .run(registerAccountModel);

  function registerAccountModel(modelManager, apiManager, $q) {
    modelManager.register('app.model.account', new Account(apiManager, $q));
  }

  /**
   * @namespace app.model.account.Account
   * @memberof app.model.account
   * @name app.model.account.Account
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {object} $q - the $q service for promise/deferred objects
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {object} $q - the $q service for promise/deferred objects
   * @property {boolean} loggedIn - a flag indicating if user logged in
   * @property {object} accountData - the account data object
   * @class
   */
  function Account(apiManager, $q) {
    var accountData = false;

    return {
      getAccountData: getAccountData,
      login: login,
      logout: logout,
      verifySession: verifySession,
      isAdmin: isAdmin,
      isLoggedIn: isLoggedIn
    };

    function getAccountData() {
      return accountData;
    }

    /**
     * @function login
     * @memberof app.model.account.Account
     * @description Log in of the application at model layer
     * @param {string} username - the username
     * @param {string} password - the password
     * @returns {promise} A promise object
     * @public
     */
    function login(username, password) {
      var accountApi = apiManager.retrieve('app.api.account');
      return accountApi.login(username, password)
        .then(function (response) {
          // Check that the response data is actually valid - data must be an object
          // string indicates that maybe an HTML error page was returned (e.g. from a proxy or firewall)
          if (!angular.isObject(response.data)) {
            // Reject the promise and change the status code to indicate a server error
            response.status = 500;
            return $q.reject(response);
          }
          onLoggedIn(response);
        });
    }

    /**
     * @function logout
     * @memberof app.model.account.Account
     * @description Log out of the application at model layer
     * @returns {promise} A promise object
     * @public
     */
    function logout() {
      var accountApi = apiManager.retrieve('app.api.account');
      return accountApi.logout()
        .then(function () {
          onLoggedOut();
        });
    }

    /**
     * @function verifySession
     * @memberof app.model.account.Account
     * @description verify if current session
     * @public
     * @returns {promise} A promise object
     */
    function verifySession() {
      var accountApi = apiManager.retrieve('app.api.account');
      var p = accountApi.verifySession();

      p.then(
        function (response) {
          onLoggedIn(response);
        },
        function () {
          onLoggedOut();
        }
      );

      return p;
    }

    /**
     * @function isAdmin
     * @memberof app.model.account.Account
     * @description Return true if this user is an ITOps admin
     * @public
     * @returns {boolean} True if this user is an ITOps admin
     */
    function isAdmin() {
      return accountData && accountData.isAdmin;
    }

    function isLoggedIn() {
      return !!accountData;
    }

    /**
     * @function onLoggedIn
     * @memberof app.model.account.Account
     * @description Logged-in handler at model layer
     * @param {object} response - the HTTP response object
     * @private
     */
    function onLoggedIn(response) {
      var sessionExpiresOnEpoch = response.headers()['x-cap-session-expires-on'];

      var loginData = response.data || {};
      var loginRes = loginData.user ? loginData.user : loginData;
      accountData = {
        username: loginRes.name || loginRes.account,
        isAdmin: loginRes.admin,
        sessionExpiresOn: moment.unix(sessionExpiresOnEpoch)
      };
    }

    /**
     * @function onLoggedOut
     * @memberof app.model.account.Account
     * @description Logged-out handler at model layer
     * @private
     */
    function onLoggedOut() {
      accountData = false;
    }

  }

})();
