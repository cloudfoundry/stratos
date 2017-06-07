(function () {
  'use strict';

  angular.module('app.framework.filters')
    .filter('max', max);

  /**
   * @namespace app.framework.filters.max
   * @memberof app.framework.filters
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
