(function () {
  'use strict';

  var events = {
    LOGIN               : 'LOGIN',
    LOGIN_FAILED        : 'LOGIN_FAILED',
    LOGOUT              : 'LOGOUT',
    HTTP_401            : 'HTTP_401',
    HTTP_403            : 'HTTP_403',
    HTTP_404            : 'HTTP_404',
    HTTP_500            : 'HTTP_500',
    HTTP_502            : 'HTTP_502', // Bad gateway, node server is down
    HTTP_5XX_ON_LOGIN   : 'HTTP_5XX_ON_LOGIN',
    REDIRECT            : 'REDIRECT',
    TRANSFER            : 'TRANSFER'
  };

  angular
    .module('app.event')
    .factory('app.event.eventService', eventServiceFactory);

  eventServiceFactory.$inject = [
    '$rootScope'
  ];

  /**
   * @namespace app.event.eventService
   * @memberof app.event
   * @name eventService
   * @description The event bus service
   * @param {object} $rootScope - the $rootScope
   * @property {object} events - the default set of events (i.e. HTTP status codes)
   * @returns {object} the event bus
   * @example
   * // subscribe to an event
   * eventService.$on(events.HTTP_401, handler);
   *
   * // emit an event
   * eventService.$emit(events.HTTP_401);
   */
  function eventServiceFactory($rootScope) {
    var eventService = $rootScope.$new();
    eventService.events = events;
    return eventService;
  }

})();
