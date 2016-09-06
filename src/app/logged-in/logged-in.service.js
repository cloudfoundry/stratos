(function () {
  'use strict';

  angular
    .module('app.logged-in')
    .factory('app.logged-in.loggedInService', loggedInServiceFactory);

  loggedInServiceFactory.$inject = [
    'app.event.eventService'
  ];

  /**
   * @namespace app.loggedIn.loggedInService
   * @memberof app.loggedIn
   * @name loggedInServiceFactory
   * @param {object} eventService - Event Service
   * @returns {object} Logged In Service
   */
  function loggedInServiceFactory(eventService) {

    var loggedIn = false;

    eventService.$on(eventService.events.LOGIN, function () {
      loggedIn = true;
    });
    eventService.$on(eventService.events.LOGOUT, function () {
      loggedIn = false;
    });
    return {
      isLoggedIn: isLoggedIn
    };

    function isLoggedIn() {
      return loggedIn;
    }

  }

})();
