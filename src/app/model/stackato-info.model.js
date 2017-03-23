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
    .run(registerStackatoInfoModel);

  registerStackatoInfoModel.$inject = [
    'modelManager',
    'stackatoInfoService'
  ];

  function registerStackatoInfoModel(modelManager, stackatoInfoService) {
    modelManager.register('app.model.stackatoInfo', new StackatoInfo(stackatoInfoService));
  }

  /**
   * @namespace app.model.userInfo.UserInfo
   * @memberof app.model.userInfo
   * @name app.model.userInfo.UserInfo
   * @param {app.api.stackatoInfoService} stackatoInfoService - Service with which to fetch data from
   * @property {app.api.stackatoInfoService} stackatoInfoService - Service with which to fetch data from
   * @property {object} info - the user info data object
   * @class
   */
  function StackatoInfo(stackatoInfoService) {
    this.stackatoInfo = stackatoInfoService;
    this.info = {};
  }

  angular.extend(StackatoInfo.prototype, {
    /**
     * @function getStackatoInfo
     * @memberof app.model.stackatoInfo.StackatoInfo
     * @description Fetch the user's authorisation information per cnsi
     * @returns {promise} A promise object
     * @public
     */
    getStackatoInfo: function () {
      var that = this;
      return this.stackatoInfo.stackatoInfo()
        .then(function (response) {
          that.onStackatoInfo(response);
          return that.info;
        });
    },

    /**
     * @function version
     * @memberof app.model.stackatoInfo.StackatoInfo
     * @description Fetch the version metadata
     * @returns {promise} A promise object
     * @public
     */
    version: function () {
      return this.stackatoInfo.version();
    },

    /**
     * @function onLoggedIn
     * @memberof app.model.stackatoInfo.StackatoInfo
     * @description Logged-in handler at model layer
     * @param {object} response - the HTTP response object
     * @private
     */
    onStackatoInfo: function (response) {
      this.info = response.data;
    }

  });

})();
