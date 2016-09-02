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
    var appErrorMessage, systemErrorMessage;

    return {
      /**
       * @function _update
       * @memberOf app.error.errorService
       * @description Updates the error based on combination of system and application level error messages
       */
      _update: function () {
        var hasErrorMsg = this.getError();
        if (hasError && !hasErrorMsg) {
          eventService.$broadcast(eventService.events.APP_ERROR_CLEAR);
        }
        hasError = !!hasErrorMsg;
        if (hasError) {
          eventService.$broadcast(eventService.events.APP_ERROR_NOTIFY, hasErrorMsg);
        }
      },

      /**
       * @function getError
       * @memberOf app.error.errorService
       * @description Gets the current error message
       * @returns {string} The current error message or undefined if there is no system or application error set
       */
      getError: function () {
        return systemErrorMessage || appErrorMessage;
      },

      /**
       * @function clearSystemError
       * @memberOf app.error.errorService
       * @description Clear the system-level error
       */
      clearSystemError: function () {
        systemErrorMessage = undefined;
        this._update();
      },

      /**
       * @function setSystemError
       * @memberOf app.error.errorService
       * @description Set the system-level error.
       * @param {string} msg - the error message to set
       */
      setSystemError: function (msg) {
        if (msg) {
          systemErrorMessage = msg;
          this._update();
        }
      },

      /**
       * @function clearAppError
       * @memberOf app.error.errorService
       * @description Clear the application-level error
       */
      clearAppError: function () {
        appErrorMessage = undefined;
        this._update();
      },

      /**
       * @function setAppError
       * @memberOf app.error.errorService
       * @description Set the application-level error. There is no default error message for application errors.
       * @param {string} msg - the error message to set
       */
      setAppError: function (msg) {
        if (msg) {
          appErrorMessage = msg;
          this._update();
        }

      }
    };
  }

})();
