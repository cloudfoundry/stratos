(function () {
  'use strict';

  angular.module('app.framework.filters')
    .filter('min', min);

  /**
   * @namespace app.framework.filters.min
   * @memberof app.framework.filters
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
