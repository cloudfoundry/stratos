(function () {
  'use strict';

  /**
   * @namespace user-info
   * @name user-info.model
   * @description User Info Model
   */
  angular
    .module('user-info.model', [])
    .run(registerServiceModel);

  function registerServiceModel(modelManager, apiManager) {
    modelManager.register('user-info.model', new UserInfo(apiManager));
  }

  /**
   * @name UserInfo
   * @description Fetches user info metadata from the UAA
   * @param {object} apiManager - Api Manager
   * @returns {object}
   */
  function UserInfo(apiManager) {

    var userInfoApi = apiManager.retrieve('user-info.api');

    var model = {
      getCurrentUser: getCurrentUser,
      changePassword: changePassword,
      updateUser: updateUser
    };

    return model;

    /**
     * @name getCurrentUser
     * @description fetch meatdata for the current user
     * @returns {*}
     */
    function getCurrentUser() {
      return userInfoApi.GetCurrentUser();
    }

    function changePassword(userId, oldPassword, newPassword) {
      var config = {
        headers: {
          'x-stratos-password': oldPassword,
          'x-stratos-password-new': newPassword
        }
      };
      return userInfoApi.ChangePassword(userId, oldPassword, newPassword, config);
    }

    function updateUser(userId, data, version, password) {
      var config = {
        headers: {
          'If-Match': version
        }
      };
      if (password) {
        config.headers['x-stratos-password'] = password;
      }

      return userInfoApi.UpdateUser(userId, data, config);
    }
  }

})();
