(function () {
  'use strict';

  /**
   * @namespace app.error
   * @memberof app
   * @name error
   * @description The error module for components that support application errors to be set and cleared
   */
  angular
    .module('app.error', [], config);

  function config($httpProvider) {
    $httpProvider.interceptors.push(interceptor);
  }

  interceptor.$inject = [
    '$q',
    'appErrorErrorService',
    'appViewUpgradeCheck'
  ];

  /**
   * @name interceptor
   * @description A $http interceptor, which emits a global HTTP error event when
   * response.status === -1
   *
   * See https://docs.angularjs.org/api/ng/service/$http for details
   *
   * @param {object} $q - the $q service for promise/deferred objects
   * @param {object} appErrorErrorService - the error service
   * @param {object} appViewUpgradeCheck - the upgrade check service
   * @returns {object} The response error function
   */
  function interceptor($q, appErrorErrorService, appViewUpgradeCheck) {

    var commsErrorMsg = gettext('The Console encountered a problem communicating with the server. Please try again.');
    return {
      response: response,
      responseError: responseError
    };

    function response(response) {
      appErrorErrorService.clearSystemError();
      return response;
    }

    function responseError(response) {
      // Network failure
      if (response.status === -1) {
        appErrorErrorService.setSystemError(commsErrorMsg);
      } else if (response.status === 503 && !appViewUpgradeCheck.isUpgrading(response)) {
        appErrorErrorService.setSystemError(commsErrorMsg);
      }
      return $q.reject(response);
    }
  }
})();
