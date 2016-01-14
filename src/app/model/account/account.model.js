(function () {
  'use strict';

  angular
    .module('app.model')
    .run(registerAccountModel);

  registerAccountModel.$inject = [
    'app.model.modelManager'
  ];

  function registerAccountModel(modelManager) {

    modelManager.register('app.model.account', new Account());

    // TODO: this is just a fake implementation for Account model.
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
