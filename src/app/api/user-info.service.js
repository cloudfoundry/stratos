(function () {
  'use strict';

  /**
   * @description user info service
   */
  angular
    .module('app')
    .factory('userInfoService', UserInfoService);

  UserInfoService.$inject = [
    '$q',
    '$cookies',
    '$http',
    'app.api.apiManager'
  ];

  /**
   * @memberof app
   * @name app.userInfoService
   * @description User information service provider
   * @param {object} $q - the angular $q service
   * @param {object} $cookies - the angular $cookies service
   * @param {object} $http - the $http service
   * @param {object} apiManager - API Manager used to fetch session details
   * @returns {object} The user info service
   */
  function UserInfoService($q, $cookies, $http, apiManager) {
    var sessionName = apiManager.retrieve('app.api.account').sessionName;
    return {
      /**
       * @function userInfo
       * @memberof app.userInfoService
       * @description Fetch the user's authorisation information
       * @returns {promise} A promise object
       */
      userInfo: function () {
        if ($cookies.get(sessionName)) {
          return $http.get('/pp/v1/userinfo');
        }
        return $q.reject(sessionName + ' cookie missing!');
      }
    };
  }
})();
