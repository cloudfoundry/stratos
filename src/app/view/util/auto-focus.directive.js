(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('autoFocus', AutoFocus);

  AutoFocus.$inject = ['$timeout'];

  /**
   * A simple attribute directive to set focus on an element when linked
   * */
  function AutoFocus($timeout) {
    return {
      restrict: 'A',
      link : function (scope, element) {
        $timeout(function () {
          element[0].focus();
        });
      }
    };
  }

})();
