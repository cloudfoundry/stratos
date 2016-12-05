(function () {
  'use strict';

  angular
    .module('helion.framework.utils')
    .directive('stFilteredCollection', function () {
      return {
        require: '^stTable',
        link: function (scope, element, attr, ctrl) {
          scope.$watch(ctrl.getFilteredCollection, function (val) {
            scope.filteredCollection = val;
          });
        }
      };
    });
})();
