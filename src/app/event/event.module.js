(function () {
  'use strict';

  angular
    .module('app.event', [])

    /**
     * @name app.event.events
     * @description It is encouraged to define global event name under this
     * constant map object.
     */
    .constant('app.event.events', {
      HTTP_401: 'HTTP_401',
      HTTP_403: 'HTTP_403',
      HTTP_404: 'HTTP_404',
      HTTP_500: 'HTTP_500'
    });

})();
