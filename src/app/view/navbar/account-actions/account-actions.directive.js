(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('accountAction', accountAction);

  accountAction.$inject = [
    'app.basePath'
  ];

  function accountAction(path) {
    return {
      controller: Controller,
      controllerAs: 'accountActionCtrl',
      templateUrl: path + '/view/navbar/account-actions/account-actions.html'
    };
  }

  Controller.$inject = [
    'app.model.modelManager'
  ];

  function Controller(modelManager) {
    this.account = modelManager.retrieve('app.model.account');
  }

})();
