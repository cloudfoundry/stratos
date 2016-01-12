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

   // 1. subscribe to a event:
   eventService.$on(events.HTTP_401, handle);

   function handler(event, context) {
     //...
   }

   // 2. emit event
   eventService.$emit(events.HTTP_401);
   ```
   */

  function eventServiceFactory($rootScope) {
    return $rootScope.$new();
  }

})();
