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

  function HcfRegistrationFactory(registerService) {

    var title = gettext('Register Cluster');
    var description = gettext('Enter the cluster API endpoint URL and name.');

    return {
      add: function () {
        return registerService.add(title, description, 'hcf');
      }
    };
  }

})();
