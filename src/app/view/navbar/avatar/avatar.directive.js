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
    'modelManager',
    '$scope',
    '$document',
    '$timeout'
  ];

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
    this.accountModel = modelManager.retrieve('app.model.account');
    this.$scope = $scope;
    this.$document = $document;
    this.$timeout = $timeout;
    this.showingActions = false;
  }

  angular.extend(AvatarController.prototype, {
    /**
     * @function showActions
     * @memberof AvatarController
     * @description show actions popover
     * @public
     */
    showActions: function () {
      var that = this;
      this.showingActions = true;
      this.$timeout(function () {
        if (that.showingActions) {
          that.$document.on('click', hide);
        } else {
          that.$document.off('click', hide);
        }
      }, 0);

      function hide() {
        that.showingActions = false;
        that.$document.off('click', hide);
        that.$scope.$apply();
      }
    }
  });

})();
