(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('accountActions', accountActions);

  accountActions.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.accountActions
   * @memberof app.view
   * @name accountActions
   * @description An account-actions UI component directive
   * @param {string} path - the application base path
   * @property {app.view.accountActionsController} controller - the controller
   * @property {string} controllerAs - the identifier for the controller
   * @property {string} templateUrl - the template filepath
   */
  function accountActions(path) {
    return {
      controller: accountActionsController,
      controllerAs: 'accountActionsCtrl',
      templateUrl: path + '/view/navbar/account-actions/account-actions.html'
    };
  }

  accountActionsController.$inject = [
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.accountActionsController
   * @memberof app.view
   * @name accountActionsController
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.model.account} account - the account model
   */
  function accountActionsController(modelManager) {
    this.account = modelManager.retrieve('app.model.account');
  }

})();
