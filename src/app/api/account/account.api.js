(function () {
  'use strict';

  angular
    .module('app.api')
    .run(registerAccountApi);

  registerAccountApi.$inject = [
    '$http',
    'app.api.api-manager'
  ];

  function registerAccountApi($http, apiManager) {
    apiManager.register('app.api.account', new AccountApi($http));
  }

  function AccountApi($http) {
    this.$http = $http;
  }

  angular.extend(AccountApi.prototype, {
    login: function (username, password) {
      return this.$http.post('/api/auth/login', {
        data: {
          username: username,
          password: password
        }
      });
    },

    logout: function () {
      return this.$http.get('/api/auth/logout');
    },

    changePassword: function (password) {
      return this.$http.post('/api/auth/change_password', {
        data: {
          password: password
        }
      });
    }
  });


})();
