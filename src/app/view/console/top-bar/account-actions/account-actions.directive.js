(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('accountActions', accountActions);

  accountActions.$inject = [
    'app.basePath'
  ];

  function accountActions(path) {
    return {
      controller: Controller,
      controllerAs: 'accountActionsCtrl',
      templateUrl: path + '/view/console/top-bar/account-actions/account-actions.html'
    };
  }

  Controller.$inject = [
    'app.model.modelManager'
  ];

  function Controller(modelManager) {
    this.model = modelManager.retrieve('app.model.account');
  }

  angular.extend(Controller.prototype, {
    logout: function () {
      this.model.logout();
    }
  });

})();
