(function () {
  'use strict';

  /**
   * @namespace app.model.user-info
   * @memberOf app.model
   * @name user-info
   * @description User model
   */
  angular
    .module('app.model')
    .run(registerUserInfoModel);

  registerUserInfoModel.$inject = [
    'app.model.modelManager',
    'userInfoService'
  ];

  function registerUserInfoModel(modelManager, userInfoService) {
    modelManager.register('app.model.userInfo', new UserInfo(userInfoService));
  }

  /**
   * @namespace app.model.userInfo.UserInfo
   * @memberof app.model.userInfo
   * @name app.model.userInfo.UserInfo
   * @param {app.api.userInfoService} userInfoService - Service with which to fetch data from
   * @property {app.api.userInfoService} userInfoService - Service with which to fetch data from
   * @property {object} info - the user info data object
   * @class
   */
  function UserInfo(userInfoService) {
    this.userInfoService = userInfoService;
    this.info = {};
  }

  angular.extend(UserInfo.prototype, {
    /**
     * @function login
     * @memberof app.model.userInfo.UserInfo
     * @description Fetch the user's authorisation information per cnsi
     * @returns {promise} A promise object
     * @public
     */
    getUserInfo: function () {
      var that = this;
      return this.userInfoService.userInfo()
        .then(function (response) {
          that.onUserInfo(response);
          return that.info;
        });
    },

    /**
     * @function onLoggedIn
     * @memberof app.model.account.Account
     * @description Logged-in handler at model layer
     * @param {object} response - the HTTP response object
     * @private
     */
    onUserInfo: function (response) {
      this.info = _.keyBy(response.data, 'cnsi_guid') || {};
    }

  });

})();
