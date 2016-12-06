(function () {
  'use strict';

  angular
    .module('helion.framework.utils')
    .directive('stFilteredCollection', stFilteredCollection);

  /**
   * @name stFilteredCollection
   * @description Provides scope access to angular-smart-table's filtered collection.
   * This is useful in conjunction with st-search.
   * @returns {*}
   */
  function stFilteredCollection() {
    return {
      require: '^stTable',
      link: function (scope, element, attr, ctrl) {
        scope.$watch(ctrl.getFilteredCollection, function (val) {
          scope.filteredCollection = val;
        });
      }
    };
  }
})();
