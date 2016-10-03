(function () {
  'use strict';

  /**
   * @description user info service
   */
  angular
    .module('app')
    .factory('stackatoInfoService', StackatoInfoService);

  StackatoInfoService.$inject = [
    '$http'
  ];

  /**
   * @memberof app
   * @name app.stackatoInfoService
   * @description User information service provider
   * @param {object} $http - the $http service
   * @returns {object} The user info service
   */
  function StackatoInfoService($http) {
    return {
      /**
       * @function stackatoInfo
       * @memberof app.stackatoInfoService
       * @description Fetch the user's authorisation information
       * @returns {promise} A promise object
       */
      stackatoInfo: function () {
        return $http.get('/pp/v1/stackato/info');
      },

      /**
       * @function version
       * @memberof app.stackatoInfoService
       * @description Fetch the version metadata
       * @returns {promise} A promise object
       */
      version: function () {
        return $http.get('/pp/v1/version');
      }
    };
  }
})();
