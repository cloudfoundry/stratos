(function () {
  'use strict';

  angular
    .module('helion.framework.utils')
    .directive('autoFocus', AutoFocus);

  AutoFocus.$inject = ['$timeout'];

  /**
   * A simple attribute directive to set focus on an element when linked
   * @param {Object} $timeout - the Angular $timeout service
   * @returns {Object} the auto-focus directive
   * */
  function AutoFocus($timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        $timeout(function () {
          element[0].focus();
        }, attrs.autoFocus);
      }
    };
  }

})();
