(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.log-stream.cfLogViewerReize', [])
    .directive('cfLogViewerResize', cfLogViewerResize);

  /**
   * @name cfLogViewerResize
   * @param {object} $window - the angular $window Service
   * @param {object} $timeout - the Angular $timeout service
   * @returns {object} CF Log Viewer Resize directive
   */
  function cfLogViewerResize($window, $timeout) {

    function cfLogViewerResizeLink(scope, element) {

      function onResize() {
        var h = $window.innerHeight;
        // Add 24px margin at the bottom
        var top = element.offset().top + 24;
        var sz = h - top;
        element.innerHeight(sz);
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
      link: cfLogViewerResizeLink
    };
  }
})();
