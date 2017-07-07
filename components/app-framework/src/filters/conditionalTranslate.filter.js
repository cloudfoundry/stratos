(function () {
  'use strict';

  // The filters
  angular.module('app.framework.filters')
    .filter('conditionalTranslate', conditionalTranslate);

  /**
   * @namespace app.framework.filters.conditionalTranslate
   * @memberof app.framework.filters
   * @name conditionalTranslate
   * @description ???????
   * @param {object} $filter - Angular $filter service
   * @returns {Function} The filter itself
   */
  function conditionalTranslate($filter) {
    return function (input, translate) {
      return translate ? $filter('translate')(input) : input;
    };
  }

})();
