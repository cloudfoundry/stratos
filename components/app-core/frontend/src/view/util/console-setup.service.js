(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('consoleSetupCheck', consoleSetupServiceFactory)
    .config(consoleSetupCheckInterceptor);

  /**
   * @namespace consoleSetupCheck
   * @memberof app.view
   * @name app.view.consoleSetupCheckInterceptor
   * @param {object} $httpProvider - angular's $httpProvider object
   * @description Installs the Console Setup Check interceptor into the http chain.
   */
  function consoleSetupCheckInterceptor($httpProvider) {
    $httpProvider.interceptors.push('consoleSetupCheck');
  }

  /**
   * @namespace consoleSetupCheck
   * @memberof app.view
   * @name app.view.consoleSetupCheck
   * @param {object} $q - the Angular Promise service
   * @param {object} $state - the Angular $state service
   * @param {object} appEventService - the event bus service
   * @description The utility will intercept all HTTP responses and check for 503/upgrade responses
   * @returns {object} The upgrade check service
   */
  function consoleSetupServiceFactory($q, appEventService) {

    var service = {
      setupRequired: setupRequired,
      responseError: responseError,
      setupState: null
    };

    return service;

    /**
     * @function setupRequired
     * @memberof app.view.consoleSetupCheck
     * @param {object} response - $http response object
     * @description Checks if the supplied response indicates an upgrade in progress
     * @returns {boolean} Flag indicating if upgrade in progress
     */
    function setupRequired(response) {
      return true;
      // return response.status === 503 && !!response.headers('Stratos-Setup-Required') && response.config.url.indexOf('/pp') === 0;
    }

    /**
     * @function responseError
     * @memberof app.view.consoleSetupCheck
     * @param {object} rejection - $http response object
     * @description HTTP Interceptor function for processing response errors
     * @returns {object} Promise for onward error processing
     */
    function responseError(rejection) {
      // rejection is a response object
      // Must be a 503 with the Stratos-Setup-Required header and must request must be to the backend
      if (setupRequired(rejection)) {
        if (service.setupState) {
          appEventService.$emit(appEventService.events.TRANSFER, service.setupState);
        } else {
          // This indicates upgrade in progress, so change state to an upgrade error page
          appEventService.$emit(appEventService.events.TRANSFER, 'error-page', {error: 'setupRequired'});
        }
      }
      // Always return the rejection as it was
      return $q.reject(rejection);
    }
  }

})();
