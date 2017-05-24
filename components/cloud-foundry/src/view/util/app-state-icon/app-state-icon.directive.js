(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application')
    .directive('appStateIcon', appStateIcon);

  /**
   * @name appStateIcon
   * @description A directive for showing an icon for application state
   * @returns {function} The directive
   */
  function appStateIcon() {
    return {
      bindToController: {
        state: '='
      },
      controller: AppStateIconController,
      controllerAs: 'appIconCtrl',
      restrict: 'E',
      scope: {},
      templateUrl: 'plugins/cloud-foundry/view/util/app-state-icon/app-state-icon.html'

    };
  }
  /**
   * @name AppStateIconController
   * @constructor
   */
  function AppStateIconController() {}

  angular.extend(AppStateIconController.prototype, {});

})();

