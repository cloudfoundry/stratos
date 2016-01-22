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

  config.$inject = [
    '$httpProvider'
  ];

  function config($httpProvider) {
    $httpProvider.interceptors.push(interceptor);
  }

  /**
   * A $http interceptor, which emits a global http error event when
   * response.status >= 400
   *
   * check https://docs.angularjs.org/api/ng/service/$http for details on
   * $http interceptors.
   */
  interceptor.$inject = [
    '$q',
    'app.event.eventService'
  ];

  function interceptor($q, eventService) {
    return {
      responseError: responseError
    };

    function responseError(response) {
      eventService.$emit('HTTP_' + response.status, response);
      return $q.reject(response);
    }
  }

})();
