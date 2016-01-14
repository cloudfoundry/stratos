(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('application', application);

  application.$inject = [
    'app.basePath'
  ];

  function application(path) {
    return {
      controller: Controller,
      controllerAs: 'applicationCtrl',
      templateUrl: path + '/view/application.html'
    };
  }

  Controller.$inject = [
    'app.event.eventService',
    'app.model.modelManager'
  ];

  function Controller(eventService, modelManager) {
    this.eventService = eventService;
    this.account = modelManager.retrieve('app.model.account');
    this.navigation = modelManager.retrieve('app.model.navigation');
  }

  angular.extend(Controller.prototype, {
    login: function (name) {
      this.account.login(name);
      this.navigation
        .reset()
        .addMenuItem('applications', 'applications', gettext('Applications'))
        .addMenuItem('organizations', 'organizations', gettext('Organizations'));
      this.eventService.$emit(this.eventService.events.LOGGED_IN);
    },

    logout: function () {
      this.account.logout();
      this.navigation.reset();
      this.eventService.$emit(this.eventService.events.LOGGED_OUT);
    }
  });

})();
