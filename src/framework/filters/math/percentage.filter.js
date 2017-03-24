(function () {
  'use strict';

  angular.module('helion.framework.filters')
    .filter('percentage', percentage);

  percentage.$inject = ['$filter'];

  /**
   * @namespace helion.framework.filters.percentage
   * @memberof helion.framework.filters
   * @name percentage
   * @description An angular filter which converts a float between 0 and 1 into a whole number + '%' char.  E.G. 42%
   * @param {object} $filter - angular $filter service
   * @returns {Function} The filter itself
   */
  function percentage($filter) {
    return function (input, decimals) {
      decimals = decimals || 0;

      var result = $filter('number')(input * 100, decimals);

      // Handle non-numeric inputs by returning '' like the number filter does.
      return result === '' ? '' : result + '%';
    };
  }
})();
