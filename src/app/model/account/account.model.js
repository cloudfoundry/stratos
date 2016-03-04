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

  registerAccountModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerAccountModel(modelManager, apiManager) {
    modelManager.register('app.model.account', new Account(apiManager));
  }

  /**
   * @namespace app.model.account.Account
   * @memberof app.model.account
   * @name app.model.account.Account
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {boolean} loggedIn - a flag indicating if user logged in
   * @class
   */
  function Account(apiManager) {
    this.apiManager = apiManager;
    this.loggedIn = false;
  }

  angular.extend(Account.prototype, {
    /**
     * @function login
     * @memberof app.model.account.Account
     * @description Log in of the application at model layer
     * @param {string} username - the username
     * @param {string} password - the password
     * @returns {promise} A promise object
     * @public
     */
    login: function (username, password) {
      var that = this;
      var accountApi = this.apiManager.retrieve('app.api.account');
      return accountApi.login(username, password)
        .then(function (response) {
          that.onLoggedIn(response);
        });
    },

    /**
     * @function logout
     * @memberof app.model.account.Account
     * @description Log out of the application at model layer
     * @returns {promise} A promise object
     * @public
     */
    logout: function () {
      var that = this;
      var accountApi = this.apiManager.retrieve('app.api.account');
      return accountApi.logout()
        .then(function () {
          that.onLoggedOut();
        });
    },

    /**
     * @function verifySession
     * @memberof app.model.account.Account
     * @description verify if current session
     * @public
     * @returns {promise} A promise object
     */
    verifySession: function () {
      var accountApi = this.apiManager.retrieve('app.api.account');
      var p = accountApi.verifySession();
      var that = this;

      p.then(
        function (response) {
          that.onLoggedIn(response);
        },
        function () {
          that.onLoggedOut();
        }
      );

      return p;
    },

    /**
     * @function onLoggedOut
     * @memberof app.model.account.Account
     * @description Logged-in handler at model layer
     * @param {object} response - the HTTP response object
     * @private
     * @returns {void}
     */
    onLoggedIn: function (response) {
      this.loggedIn = true;
      this.data = response.data;
    },

    /**
     * @function onLoggedOut
     * @memberof app.model.account.Account
     * @description Logged-out handler at model layer
     * @private
     * @returns {void}
     */
    onLoggedOut: function () {
      this.loggedIn = false;
      delete this.data;
    }

  });

})();
