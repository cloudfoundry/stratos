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
    .run(registerConsoleInfoModel);

  function registerConsoleInfoModel(modelManager, appUtilsService, consoleInfoService) {
    modelManager.register('app.model.consoleInfo', new ConsoleInfo(appUtilsService, consoleInfoService));
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
  function ConsoleInfo(appUtilsService, consoleInfoService) {
    var info = {};

    return {
      info: info,
      getconsoleInfo: getconsoleInfo,
      version: version,
      onconsoleInfo: onconsoleInfo
    };

    /**
     * @function getconsoleInfo
     * @memberof app.model.consoleInfo.consoleInfo
     * @description Fetch the user's authorisation information per cnsi
     * @returns {promise} A promise object
     * @public
     */
    function getConsoleInfo() {
      return consoleInfoService.info()
        .then(function (response) {
          onConsoleInfo(response);
          return info;
        });
    }

    /**
     * @function version
     * @memberof app.model.consoleInfo.consoleInfo
     * @description Fetch the version metadata
     * @returns {promise} A promise object
     * @public
     */
    function version() {
      return consoleInfoService.version();
    }

    /**
     * @function onLoggedIn
     * @memberof app.model.consoleInfo.consoleInfo
     * @description Logged-in handler at model layer
     * @param {object} response - the HTTP response object
     * @private
     */
    function onConsoleInfo(response) {
      appUtilsService.replaceProperties(info, response.data);
    }

  }

})();
