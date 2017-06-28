(function () {

  'use strict';

  angular
    .module('cf-app-ssh')
    .directive('terminalInfoOverlay', terminalInfoOverlay);

  /**
   * @name terminalInfoOverlay
   * @param {object} $timeout - the Angular $timeout service
   * @returns {object} Terminal Info Overlay directive
   */
  function terminalInfoOverlay($timeout) {

    var hideOverlayTimer;

    return {
      restrict: 'E',
      templateUrl: 'cf-app-ssh/view/terminal-viewer/terminal-info-overlay.html',
      controllerAs: 'termInfoCtrl',
      bindToController: {
        message: '='
      },
      controller: TerminalInfoOverlayController
    };

    function TerminalInfoOverlayController($scope) {
      var vm = this;
      vm.shown = false;
      vm.init = true;

      $scope.$watch('termInfoCtrl.message', function () {
        vm.shown = true;
        if (hideOverlayTimer) {
          $timeout.cancel(hideOverlayTimer);
        }
        hideOverlayTimer = $timeout(function () {
          vm.shown = false;
          hideOverlayTimer = undefined;
        }, 1000);
      });
    }
  }
})();
