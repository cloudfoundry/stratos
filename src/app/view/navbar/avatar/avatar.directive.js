(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('avatar', avatar);

  /**
   * @namespace app.view.avatar
   * @memberof app.view
   * @name avatar
   * @description An avatar UI component directive
   * @param {string} appBasePath - the application base path
   * @returns {object} The avatar directive definition object
   */
  function avatar(appBasePath) {
    return {
      controller: AvatarController,
      controllerAs: 'avatarCtrl',
      templateUrl: appBasePath + 'view/navbar/avatar/avatar.html'
    };
  }

  /**
   * @namespace app.view.AvatarController
   * @memberof app.view
   * @name AvatarController
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {object} $scope - angular $scope service
   * @param {object} $document - angular $document service
   * @param {object} $timeout - angular $timeout service
   * @property {app.model.account} accountModel - the account model
   * @property {object} $scope - angular $scope service
   * @property {object} $document - angular $document service
   * @property {object} $timeout - angular $timeout service
   * @property {boolean} showingActions - flag indicating show or hide actions popover.
   * @constructor
   */
  function AvatarController(modelManager, $scope, $document, $timeout) {
    var vm = this;

    vm.showingActions = false;
    vm.accountModel = modelManager.retrieve('app.model.account');
    vm.showActions = showActions;

    /**
     * @function showActions
     * @memberof AvatarController
     * @description show actions popover
     * @public
     */
    function showActions() {
      vm.showingActions = true;
      $timeout(function () {
        if (vm.showingActions) {
          $document.on('click', hide);
        } else {
          $document.off('click', hide);
        }
      }, 0);

      function hide() {
        vm.showingActions = false;
        $document.off('click', hide);
        $scope.$apply();
      }
    }

  }

})();
