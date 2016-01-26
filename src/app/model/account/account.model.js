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
   */
  function Account(apiManager) {
    this.apiManager = apiManager;
    this.loggedIn = false;
  }

  angular.extend(Account.prototype, {
    /**
     * @function login
     * @memberof app.model.account
     * @description Log in of the application at model layer
     */
    login: function (username, password) {
      var accountApi = this.apiManager.retrieve('app.api.account');
      return accountApi.login(username, password)
        .then(this.onLoggedIn.bind(this));
    },

    /**
     * @function logout
     * @memberof app.model.account
     * @description Log out of the application at model layer
     */
    logout: function () {
      var accountApi = this.apiManager.retrieve('app.api.account');
      return accountApi.logout()
        .then(this.onLoggedOut.bind(this));
    },

    /**
     * @function onLoggedOut
     * @memberof app.model.account
     * @description Logged-in handler at model layer
     */
    onLoggedIn: function (response) {
      this.loggedIn = true;
      this.data = response.data;
    },

    /**
     * @function onLoggedOut
     * @memberof app.model.account
     * @description Logged-out handler at model layer
     */
    onLoggedOut: function () {
      this.loggedIn = false;
      delete this.data;
    }

  });

})();
