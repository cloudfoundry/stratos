(function () {
  'use strict';

  angular
    .module('app.api', [], config);

  config.$inject = ['$httpProvider'];

  function config($httpProvider) {
    $httpProvider.responseInterceptors.push(interceptor);
  }

  /**
   * A $http interceptor, which emits a global http error event when
   * response.status >= 400
   *
   * check https://docs.angularjs.org/api/ng/service/$http for details on
   * $http interceptors.
   */
  interceptor.$inject = ['$q', 'app.event.eventService'];

  function interceptor($q, eventService) {
    return function (promise) {
      return promise.then(success, error);
    };

    function success(response) {
      return response;
    }

    function error(response) {
      eventService.$emit('HTTP_' + response.status, response);
      return $q.reject(response);
    }
  }

})();
