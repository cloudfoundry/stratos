(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('accountActions', accountActions);

  /**
   * @namespace app.view.accountActions
   * @memberof app.view
   * @name accountActions
   * @description An account-actions UI component directive
   * @returns {object} The account actions directive definition object
   */
  function accountActions() {
    return {
      controller: AccountActionsController,
      controllerAs: 'accountActionsCtrl',
      templateUrl: 'app/view/navbar/avatar/account-actions/account-actions.html'
    };
  }

  /**
   * @namespace app.view.AccountActionsController
   * @memberof app.view
   * @name AccountActionsController
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.model.stackatoInfo} stackatoInfo - the stackatoInfo model
   * @constructor
   */
  function AccountActionsController(modelManager) {
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
  }

})();
