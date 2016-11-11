(function () {
  'use strict';

  var events = {
    LOGIN                   : 'LOGIN',
    LOGIN_FAILED            : 'LOGIN_FAILED',
    LOGIN_TIMEOUT           : 'LOGIN_TIMEOUT',
    LOGOUT                  : 'LOGOUT',
    HTTP_401                : 'HTTP_401',
    HTTP_403                : 'HTTP_403',
    HTTP_404                : 'HTTP_404',
    HTTP_500                : 'HTTP_500',
    HTTP_502                : 'HTTP_502', // Bad gateway, node server is down
    HTTP_5XX_ON_LOGIN       : 'HTTP_5XX_ON_LOGIN',
    REDIRECT                : 'REDIRECT',
    TRANSFER                : 'TRANSFER',
    ROLES_UPDATED           : 'ROLES_UPDATED',
    MODAL_INTERACTION_START : 'MODAL_INTERACTION_START',
    MODAL_INTERACTION_END   : 'MODAL_INTERACTION_END',
    APP_ERROR_NOTIFY        : 'APP_ERROR_NOTIFY',
    APP_ERROR_CLEAR         : 'APP_ERROR_CLEAR',
    VCS_OAUTH_CANCELLED     : 'vcs.OAUTH_CANCELLED'
  };

  angular
    .module('app.event')
    .factory('app.event.eventService', eventServiceFactory);

  eventServiceFactory.$inject = [
    '$rootScope',
    'helion.framework.utils.dialogEvents'
  ];

  /**
   * @namespace app.event.eventService
   * @memberof app.event
   * @name eventService
   * @description The event bus service
   * @param {object} $rootScope - the $rootScope
   * @param {object} dialogEvents - UI Framework's Dialog Events service
   * @property {object} events - the default set of events (i.e. HTTP status codes)
   * @returns {object} the event bus
   * @example
   * // subscribe to an event
   * eventService.$on(events.HTTP_401, handler);
   *
   * // emit an event
   * eventService.$emit(events.HTTP_401);
   */
  function eventServiceFactory($rootScope, dialogEvents) {
    var eventService = $rootScope.$new();
    eventService.events = events;
    // Configure the dialog events service to send events using this event service (scope)
    dialogEvents.configure({ scope: eventService });
    return eventService;
  }

})();
