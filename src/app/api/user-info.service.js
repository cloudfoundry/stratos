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

  function UserInfoService($q, $cookies, $http, apiManager) {
    var sessionName = apiManager.retrieve('app.api.account').sessionName;
    return {
      userInfo: function () {
        if ($cookies.get(sessionName)) {
          return $http.get('/pp/v1/userinfo');
        }
        return $q.reject(sessionName + ' cookie missing!');
      }

    };
  }
})();
