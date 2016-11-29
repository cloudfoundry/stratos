(function () {
  'use strict';

  angular.module('helion.framework.filters')
    .filter('max', max);

  max.$inject = [];

  /**
   * @namespace helion.framework.filters.max
   * @memberof helion.framework.filters
   * @name max
   * @description An angular filter which returns the maximum value for all args passed in
   * @returns {Function} The filter itself
   */
  function max() {
    return function () {
      return _.max(arguments);
    };
  }
})();
