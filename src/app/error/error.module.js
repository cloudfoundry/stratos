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

  config.$inject = [
    '$httpProvider'
  ];

  function config($httpProvider) {
    $httpProvider.interceptors.push(interceptor);
  }

  interceptor.$inject = [
    '$q',
    'app.error.errorService'
  ];

  /**
   * @name interceptor
   * @description A $http interceptor, which emits a global HTTP error event when
   * response.status === -1
   *
   * See https://docs.angularjs.org/api/ng/service/$http for details
   *
   * @param {object} $q - the $q service for promise/deferred objects
   * @param {object} errorService - the error service
   * @returns {object} The response error function
   */
  function interceptor($q, errorService) {
    return {
      response: response,
      responseError: responseError
    };

    function response(response) {
      errorService.clearError();
      return response;
    }

    function responseError(response) {
      // Network failure
      if (response.status === -1) {
        errorService.setError();
      }
      return $q.reject(response);
    }
  }
})();
