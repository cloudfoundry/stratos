(function () {
  'use strict';

  angular
    .module('app.logged-in')
    .factory('app.logged-in.loggedInService', loggedInServiceFactory);

  loggedInServiceFactory.$inject = [
    'app.event.eventService'
  ];

  /**
   * @namespace app.logged-in.loggedInService
   * @memberof app.logged-in
   * @name loggedInServiceFactory
   * @description Service to store the fact that the user is currently logged in
   * @param {object} eventService - Event service
   * @returns LoggedIn Service
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
