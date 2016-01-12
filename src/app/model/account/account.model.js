(function () {
  'use strict';

  angular
    .module('app.model')
    .run(accountModelFactory);

  accountModelFactory.$inject = [
    'app.model.modelManager'
  ];

  function accountModelFactory(modelManager) {
    modelManager.register('app.model.account', {
      name: 'Sean',
      actions: {
        login: login,
        logout: logout
      }
    });

    function login() {}
    function logout() {}
  }

})();
