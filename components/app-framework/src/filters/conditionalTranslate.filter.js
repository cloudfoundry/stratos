(function () {
  'use strict';

  // The filters
  angular.module('app.framework.filters')
    .filter('conditionalTranslate', conditionalTranslate);

  /**
   * @namespace app.framework.filters.conditionalTranslate
   * @memberof app.framework.filters
   * @name conditionalTranslate
   * @description Conditionally run text through translate filter given a boolean param
   * @param {object} $filter - Angular $filter service
   * @example { 'i18n.string' | conditionalTranslate:imaginaryController.shouldTranslate }
   * @returns {Function} The filter itself
   */
  function conditionalTranslate($filter) {

    var conditionalTranslate = function (input, translate) {
      return translate ? $filter('translate')(input) : input;
    };

    // Ensure the filter is reapplied on change of language
    conditionalTranslate.$stateful = true;

    return conditionalTranslate;
  }

})();
