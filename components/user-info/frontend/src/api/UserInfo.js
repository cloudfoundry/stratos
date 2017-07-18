(function () {
  'use strict';

  angular
    .module('user-info.api', [])
    .run(registerApi);

  function registerApi($http, apiManager) {
    apiManager.register('user-info.api', new UserInfoApi($http));
  }

  function UserInfoApi($http) {
    this.$http = $http;
  }

  /* eslint-disable camelcase */
  angular.extend(UserInfoApi.prototype, {

    GetCurrentUser: function () {
      var user = {};
      var that = this;
      return this.$http.get('/pp/v1/uaa/userinfo').then(function (response) {
        user.userInfo = response.data;
        var userId = response.data.user_id;
        return that.GetUser(userId).then (function (data) {
          user.user = data;
          return user;
        });
      });
    },

    /**
     * Get user metadata for the specified user
     */
    GetUser: function (userId) {
      return this.$http.get('/pp/v1/uaa/Users/' + userId).then(function (response) {
        return response.data;
      });
    },

    UpdateUser: function (user_id, data, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/buildpacks/' + guid + '';
      config.method = 'PUT';
      config.data = value;

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

    ChangePassword: function (user_id, oldPassword, newPassword) {
      var config = {};
      //config.params = params;
      config.url = '/pp/v1/uaa/Users/' + user_id + '/password';
      config.method = 'PUT';
      config.data = {
        oldPassword: oldPassword,
        password: newPassword
      };

      return this.$http(config);
    }

  });
  /* eslint-enable camelcase */

})();
