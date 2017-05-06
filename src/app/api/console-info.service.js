(function () {
  'use strict';

  /**
   * @description user info service
   */
  angular
    .module('app')
    .factory('consoleInfoService', ConsoleInfoService);

  /**
   * @memberof app
   * @name app.consoleInfoService
   * @description User information service provider
   * @param {object} $http - the $http service
   * @returns {object} The user info service
   */
  function ConsoleInfoService($http) {
    return {
      /**
       * @function info
       * @memberof app.consoleInfoService
       * @description Fetch console info including the user and endpoint info
       * @returns {promise} A promise object
       */
      info: function () {
        return $http.get('/pp/v1/info');
      },

      /**
       * @function version
       * @memberof app.consoleInfoService
       * @description Fetch the version metadata
       * @returns {promise} A promise object
       */
      version: function () {
        return $http.get('/pp/v1/version');
      }
    };
  }
})();
