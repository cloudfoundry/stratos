(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('avatar', avatar);

  avatar.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.avatar
   * @memberof app.view
   * @name avatar
   * @description An avatar UI component directive
   * @param {string} path - the application base path
   * @returns {object} The avatar directive definition object
   */
  function avatar(path) {
    return {
      controller: AvatarController,
      controllerAs: 'avatarCtrl',
      templateUrl: path + 'view/navbar/avatar/avatar.html'
    };
  }

  AvatarController.$inject = [
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.AvatarController
   * @memberof app.view
   * @name AvatarController
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.model.account} account - the account model
   * @property {boolean} showActions - flag indicating show or hide actions popover.
   * @constructor
   */
  function AvatarController(modelManager) {
    this.model = modelManager.retrieve('app.model.account');
    this.showActions = false;
  }

  angular.extend(AvatarController.prototype, {
    /**
     * @function showHideActions
     * @memberof AvatarController
     * @description show or hide actions popover
     * @returns {void}
     * @public
     */
    showHideActions: function () {
      this.showActions = !this.showActions;
    }
  });

})();
