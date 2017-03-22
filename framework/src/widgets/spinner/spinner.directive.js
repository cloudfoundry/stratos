(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('spinner', spinner);

  /**
   * @name spinner
   * @description A loading spinner directive with default
   * height and width of 50px.
   * @returns {*} Spinner template
   * @example
   * <spinner></spinner>
   */
  function spinner() {
    return {
      templateUrl: 'widgets/spinner/spinner.html'
    };
  }

})();
