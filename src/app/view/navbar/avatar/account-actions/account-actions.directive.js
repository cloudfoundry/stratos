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
   * @returns {object} The account actions directive definition object
   */
  function accountActions(path) {
    return {
      controller: AccountActionsController,
      controllerAs: 'accountActionsCtrl',
      templateUrl: path + 'view/navbar/avatar/account-actions/account-actions.html'
    };
  }

  AccountActionsController.$inject = [
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.AccountActionsController
   * @memberof app.view
   * @name AccountActionsController
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.model.account} account - the account model
   * @constructor
   */
  function AccountActionsController(modelManager) {
    this.model = modelManager.retrieve('app.model.account');
  }

})();
