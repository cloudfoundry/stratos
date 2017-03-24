(function () {
  'use strict';

  angular.module('helion.framework.filters')
    .filter('min', min);

  min.$inject = [];

  /**
   * @namespace helion.framework.filters.min
   * @memberof helion.framework.filters
   * @name min
   * @description An angular filter which returns the minimum value for all args passed in
   * @returns {Function} The filter itself
   */
  function min() {
    return function () {
      return _.min(arguments);
    };
  }

})();
