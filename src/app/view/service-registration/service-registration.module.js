(function () {
  'use strict';

  angular
    .module('app.view.service-registration', [])
    .config(registerRouteConfig);

  registerRouteConfig.$inject = [
    '$stateProvider'
  ];

  function registerRouteConfig($stateProvider) {
    $stateProvider.state('service-registration', {
      url: '/service-registration',
      templateUrl: 'app/view/service-registration/service-registration.html'
    });
  }

})();
