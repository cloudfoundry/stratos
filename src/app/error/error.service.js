(function () {
  'use strict';
  angular
    .module('app.error')
    .factory('app.error.errorService', errorServiceFactory);

  errorServiceFactory.$inject = [
    'app.event.eventService'
  ];

  /**
   * @namespace app.error.errorService
   * @memberof app.error
   * @name errorService
   * @description The application error service
   * @param {object} eventService - the event service
   * @returns {object} the error service
   */
  function errorServiceFactory(eventService) {
    var hasError = false;

    return {
      /**
       * @function clearError
       * @memberOf app.error.errorService
       * @description Clear the application error if one has been set
       */
      clearError: function () {
        if (hasError) {
          hasError = false;
          eventService.$broadcast(eventService.events.APP_ERROR_CLEAR);
        }
      },

      /**
       * @function setError
       * @memberOf app.error.errorService
       * @description Set the application error. Uses a default error message if one is not supplied.
       * @param {string} msg - the error message to set
       */
      setError: function (msg) {
        hasError = true;
        if (!msg) {
          msg = gettext('The Console encountered a problem communicating with the server. Please try again.');
        }
        eventService.$broadcast(eventService.events.APP_ERROR_NOTIFY, msg);
      }
    };
  }

})();
