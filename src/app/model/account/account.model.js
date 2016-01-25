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
    'app.model.modelManager'
  ];

  function registerAccountModel(modelManager) {

    modelManager.register('app.model.account', new Account());

    /**
     * @namespace app.model.account.Account
     * @memberof app.model.account
     * @name app.model.account.Account
     * @todo This is just a fake implementation for Account model
     */
    function Account() {
      this.name = null;
      this.loggedIn = false;
    }

    angular.extend(Account.prototype, {
      login: function (name) {
        this.name = name;
        this.loggedIn = true;
      },

      logout: function () {
        this.name = null;
        this.loggedIn = false;
      }
    });
  }

})();
