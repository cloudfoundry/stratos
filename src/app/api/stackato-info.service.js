(function () {
  'use strict';

  /**
   * @description user info service
   */
  angular
    .module('app')
    .factory('stackatoInfoService', StackatoInfoService);

  StackatoInfoService.$inject = [
    '$q',
    '$cookies',
    '$http',
    'app.api.apiManager'
  ];

  /**
   * @memberof app
   * @name app.stackatoInfoService
   * @description User information service provider
   * @param {object} $q - the angular $q service
   * @param {object} $cookies - the angular $cookies service
   * @param {object} $http - the $http service
   * @param {object} apiManager - API Manager used to fetch session details
   * @returns {object} The user info service
   */
  function StackatoInfoService($q, $cookies, $http, apiManager) {
    var sessionName = apiManager.retrieve('app.api.account').sessionName;
    return {
      /**
       * @function stackatoInfo
       * @memberof app.stackatoInfoService
       * @description Fetch the user's authorisation information
       * @returns {promise} A promise object
       */
      stackatoInfo: function () {
        if ($cookies.get(sessionName)) {
          return $http.get('/pp/v1/stackato/info');
        }
        return $q.reject(sessionName + ' cookie missing!');
      }
    };
  }
})();
