(function () {
  'use strict';

  angular
    .module('app.event')
    .factory('app.event.eventService', eventServiceFactory);

  eventServiceFactory.$inject = [
    '$rootScope'
  ];

  /**
   * @name app.event.eventService
   * @example
   ```js
   // subscribe to an event:
   eventService.$on(events.HTTP_401, handler);

   // emit an event
   eventService.$emit(events.HTTP_401);
   ```
   */

  function eventServiceFactory($rootScope) {
    return $rootScope.$new();
  }

})();
