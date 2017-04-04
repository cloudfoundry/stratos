(function () {
  'use strict';

  /**
   * @namespace app.utils
   * @memberof app
   * @name error
   * @description The error module for components that support application errors to be set and cleared
   */
  angular
    .module('app.utils')
    .config(config);

  function config($httpProvider) {
    $httpProvider.interceptors.push(interceptor);
  }

  /**
   * @name interceptor
   * @description A $http interceptor, which emits a global HTTP error event when
   * response.status === -1
   *
   * See https://docs.angularjs.org/api/ng/service/$http for details
   *
   * @param {object} $q - the $q service for promise/deferred objects
   * @param {object} appErrorService - the error service
   * @param {object} appUpgradeCheck - the upgrade check service
   * @returns {object} The response error function
   */
  function interceptor($q, appErrorService, appUpgradeCheck) {

    var commsErrorMsg = gettext('The Console encountered a problem communicating with the server. Please try again.');
    return {
      response: response,
      responseError: responseError
    };

    function response(response) {
      appErrorService.clearSystemError();
      return response;
    }

    function responseError(response) {
      // Network failure
      if (response.status === -1) {
        appErrorService.setSystemError(commsErrorMsg);
      } else if (response.status === 503 && !appUpgradeCheck.isUpgrading(response)) {
        appErrorService.setSystemError(commsErrorMsg);
      }
      return $q.reject(response);
    }
  }
})();
