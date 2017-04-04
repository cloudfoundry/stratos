(function () {
  'use strict';

  /**
   * @namespace app.api
   * @memberof app
   * @name api
   * @description The API layer of the UI platform that handles HTTP requests
   */
  angular
    .module('app.api', [], config);

  function config($httpProvider) {
    $httpProvider.interceptors.push(interceptor);
  }

  /**
   * @name interceptor
   * @description A $http interceptor, which emits a global HTTP error event when
   * response.status >= 400
   *
   * See https://docs.angularjs.org/api/ng/service/$http for details
   *
   * @param {object} $q - the $q service for promise/deferred objects
   * @param {object} appEventService - the event bus service
   * @returns {object} The response error function
   */
  function interceptor($q, appEventService) {
    return {
      responseError: responseError
    };

    function responseError(response) {
      appEventService.$emit('HTTP_' + response.status, response);
      return $q.reject(response);
    }
  }

})();
