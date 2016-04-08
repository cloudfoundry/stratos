(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.services')
    .directive('applicationService', applicationService);

  applicationService.$inject = [];

  function applicationService() {
    return {
      templateUrl: 'plugins/cloud-foundry/view/applications/application/services/service/service.html'
    };
  }
})();
