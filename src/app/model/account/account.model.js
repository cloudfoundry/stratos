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
    'app.api.api-manager',
    'app.model.modelManager'
  ];

  function registerAccountModel(modelManager, apiMnager) {
    var accountApi = apiMnager.retrieve('app.api.account');
    modelManager.register('app.model.account', new Account(accountApi));
  }

  /**
   * @namespace app.model.account.Account
   * @memberof app.model.account
   * @name app.model.account.Account
   */

  function Account(accountApi) {
    this.accountApi = accountApi;
    this.loggedIn = false;
  }

  angular.extend(Account.prototype, {
    login: function (username, password) {
      this.accountApi.login(username, password)
        .then(this.onLoggedIn);
    },

    logout: function () {
      this.accountApi.logout()
        .then(this.onLoggedOut);
    },

    onLoggedIn: function (response) {
      this.loggedIn = true;
      this.data = response.data;
    },

    onLoggedOut: function () {
      this.loggedIn = false;
      delete this.data;
    }

  });

})();
