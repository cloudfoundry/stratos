(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application')
    .directive('applicationService', applicationService);

  applicationService.$inject = [];

  function applicationService() {
    return {
      bindToController: {
        service: '=',
        app: '=',
        parent: '='
      },
      controller: ApplicationServiceController,
      controllerAs: 'applicationServiceCtrl',
      scope: {},
      templateUrl: 'plugins/cloud-foundry/view/applications/application/service/service.html'
    };
  }

  ApplicationServiceController.$inject = [
  ];

  function ApplicationServiceController() {
  }

  angular.extend(ApplicationServiceController.prototype, {
    cancel: function() {
      this.parent.flyoutActive = false;
    },
    add: function() {
      //TBD Logic to do the add
      this.parent.flyoutActive = false;
    }
  });

})();
