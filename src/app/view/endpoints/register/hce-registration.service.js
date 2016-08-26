(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.hceRegistration', HceRegistrationFactory);

  HceRegistrationFactory.$inject = [
    'app.view.registerService'
  ];

  /**
   * @name HceRegistrationFactory
   * @description Register a hce service via a slide out
   * @namespace app.view.hceRegistration.HceRegistrationFactory
   * @param {app.view.registerService} registerService register service to display the core slide out
   * @property {function} add Opens slide out containing registration form
   * @constructor
   */
  function HceRegistrationFactory(registerService) {

    var title = gettext('Register Code Engine Endpoint');
    var description = gettext('Enter the Code Engine endpoint URL and name.');

    return {
      /**
       * @name add
       * @description Opens slide out containing registration form
       * @namespace app.view.hceRegistration.HceRegistrationFactory
       * @returns {promise}
       */
      add: function () {
        return registerService.add('hce', title, description);
      }
    };
  }

})();
