(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.hceRegistration', HceRegistrationFactory);

  HceRegistrationFactory.$inject = [
    'app.view.registerService'
  ];

  function HceRegistrationFactory(registerService) {

    var title = gettext('Register Code Engine Endpoint');
    var description = gettext('Enter the Code Engine endpoint URL and name.');

    return {
      add: function () {
        return registerService.add(title, description, 'hce');
      }
    };
  }

})();
