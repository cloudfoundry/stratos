(function () {
  'use strict';

  // The filters
  angular.module('app.framework.filters')
    .filter('momentDateFormat', momentDateFormat);

  /**
   * @namespace app.framework.filters.momentDateFormat
   * @memberof app.framework.filters
   * @name momentDateFormat
   * @description An angular filter which will show a standard way to represent date/time strings via Moment.js
   * @param {object} $filter - Angular $filter service
   * @returns {Function} The filter itself
   */
  function momentDateFormat($filter) {
    return function (input) {
      return $filter('amDateFormat')(input, 'L LTS');
    };
  }

})();
