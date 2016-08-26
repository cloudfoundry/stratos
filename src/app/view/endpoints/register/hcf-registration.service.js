/**
 * Created by ubuntu on 25/08/16.
 */
(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.hcfRegistration', HcfRegistrationFactory);

  HcfRegistrationFactory.$inject = [
    'app.view.registerService'
  ];

  /**
   * @name HcfRegistrationFactory
   * @description Register a hcf service via a slide out
   * @namespace app.view.hceRegistration.HcfRegistrationFactory
   * @param {app.view.registerService} registerService register service to display the core slide out
   * @property {function} add Opens slide out containing registration form
   * @constructor
   */
  function HcfRegistrationFactory(registerService) {

    var title = gettext('Register Cluster');
    var description = gettext('Enter the cluster API endpoint URL and name.');

    return {
      /**
       * @name add
       * @description Opens slide out containing registration form
       * @namespace app.view.hceRegistration.HcfRegistrationFactory
       * @returns {promise}
       */
      add: function () {
        return registerService.add('hcf', title, description);
      }
    };
  }

})();
