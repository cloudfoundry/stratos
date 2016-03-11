(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.api
   * @memberof cloud-foundry
   * @name api
   * @description The API layer of the CF platform that handles HTTP requests
   */
  angular
    .module('cloud-foundry.api', [], config);

  interceptor.$inject = [
    '$q',
    'app.event.eventService'
  ];

})();