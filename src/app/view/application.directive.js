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

  Controller.$inject = ['app.model.modelManager'];

  function Controller(modelManager) {
    this.model = modelManager.retrieve('app.model.account');
  }

  angular.extend(Controller.prototype, {
    login: function (name) {
      this.model.login(name);
    },

    logout: function () {
      this.model.logout();
    }
  });

})();
