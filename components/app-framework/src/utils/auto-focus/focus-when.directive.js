(function () {
  'use strict';

  angular
    .module('app.framework.utils')
    .directive('focusWhen', focusWhen);

  /**
   * A simple attribute directive to set focus on an element when a value is set
   * @param {Object} $timeout - the Angular $timeout service
   * @returns {Object} the focus-when directive
   * */
  function focusWhen($timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        scope.$watch(attrs.focusWhen, function (nv) {
          if (nv) {
            $timeout(function () {
              element[0].focus();
            }, 0);
          }
        });
      }
    };
  }

})();
