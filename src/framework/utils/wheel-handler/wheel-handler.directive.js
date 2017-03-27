(function () {
  'use strict';

  angular
    .module('helion.framework.utils')
    .directive('wheelHandler', WheelHandler);

  WheelHandler.$inject = ['$parse'];

  /**
   * @name WheelHandler
   * @description A simple attribute directive to handle mouse wheel events
   * @param {object} $parse - angular $parse
   * @returns {Object} the wheel-handler directive
   */
  function WheelHandler($parse) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var fn = $parse(attrs.wheelHandler, /* interceptorFn */ null, /* expensiveChecks */ true);

        element.bind('DOMMouseScroll mousewheel onmousewheel', function (event) {

          var originalEvent = event.originalEvent;
          // cross-browser wheel delta
          var delta = Math.max(-1, Math.min(1, originalEvent.wheelDelta || -originalEvent.detail));
          scope.$apply(function () {
            fn(scope, {delta: delta});
          });

          originalEvent.returnValue = false; // for IE
          if (originalEvent.preventDefault) { // for Chrome and Firefox
            originalEvent.preventDefault();
          }
        });
      }
    };
  }

})
();
