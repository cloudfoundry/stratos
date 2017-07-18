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

    /*
     * Get user metadata for the current user
     */
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

    /*
     * Get user metadata for the specified user
     */
    GetUser: function (userId) {
      return this.$http.get('/pp/v1/uaa/Users/' + userId).then(function (response) {
        if (response.data && response.data.groups) {
          response.data.groups = _.sortBy(response.data.groups, 'display');
        }
        return response.data;
      });
    },

    /*
     * Update the user record
     */
    UpdateUser: function (userId, data, httpConfigOptions) {
      var config = {};
      config.url = '/pp/v1/uaa/Users/' + userId;
      config.method = 'PUT';
      config.data = data;

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

    /*
     * Change the password of the gievn user
     */
    ChangePassword: function (user_id, oldPassword, newPassword, httpConfigOptions) {
      var config = {};
      config.url = '/pp/v1/uaa/Users/' + user_id + '/password';
      config.method = 'PUT';
      config.data = {
        oldPassword: oldPassword,
        password: newPassword
      };

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    }

  });
  /* eslint-enable camelcase */

})();
