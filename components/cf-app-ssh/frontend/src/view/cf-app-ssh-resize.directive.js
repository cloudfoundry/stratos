(function () {

  'use strict';

  angular
    .module('cf-app-ssh')
    .directive('cfAppSshResize', cfAppSshResize);

  /**
   * @name cfAppSshResize
   */
  function cfAppSshResize($window, $timeout) {

    //var BOTTOM_MARGIN = 24;

    function cfAppSshResizeLink(scope, element) {

      function onResize() {
        var h = $window.innerHeight;
        var top = element.offset().top + element.position().top;
        var sz = h - top;
        element.innerHeight(sz);
        var glassPanel = element.find('.app-ssh-glass-panel');
        glassPanel.innerHeight(sz);
        scope.$broadcast('cf-app-ssh-resize', {height: sz });
      }

      function cleanup() {
        angular.element($window).off('resize', onResize);
      }

      angular.element($window).on('resize', onResize);
      scope.$on('$destroy', cleanup);
      $timeout(onResize, 100);
    }

    return {
      restrict: 'A',
      link: cfAppSshResizeLink
    };
  }
})();
