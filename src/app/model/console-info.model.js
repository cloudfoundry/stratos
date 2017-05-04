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

  function registerStackatoInfoModel(modelManager, appUtilsService, consoleInfoService) {
    modelManager.register('app.model.stackatoInfo', new StackatoInfo(appUtilsService, consoleInfoService));
  }

  /**
   * @namespace app.model.userInfo.UserInfo
   * @memberof app.model.userInfo
   * @name app.model.userInfo.UserInfo
   * @param {app.utils.appUtilsService} appUtilsService - utils service
   * @param {app.api.consoleInfoService} consoleInfoService - Service with which to fetch data from
   * @property {object} info - the user info data object
   * @class
   */
  function StackatoInfo(appUtilsService, consoleInfoService) {
    var info = {};

    return {
      info: info,
      getStackatoInfo: getStackatoInfo,
      version: version,
      onStackatoInfo: onStackatoInfo
    };

    /**
     * @function getStackatoInfo
     * @memberof app.model.stackatoInfo.StackatoInfo
     * @description Fetch the user's authorisation information per cnsi
     * @returns {promise} A promise object
     * @public
     */
    function getStackatoInfo() {
      return consoleInfoService.info()
        .then(function (response) {
          onStackatoInfo(response);
          return info;
        });
    }

    /**
     * @function version
     * @memberof app.model.stackatoInfo.StackatoInfo
     * @description Fetch the version metadata
     * @returns {promise} A promise object
     * @public
     */
    function version() {
      return consoleInfoService.version();
    }

    /**
     * @function onLoggedIn
     * @memberof app.model.stackatoInfo.StackatoInfo
     * @description Logged-in handler at model layer
     * @param {object} response - the HTTP response object
     * @private
     */
    function onStackatoInfo(response) {
      appUtilsService.replaceProperties(info, response.data);
    }

  }

})();
