(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('spinner', spinner);

  spinner.$inject = ['helion.framework.basePath'];

  /**
   * @name spinner
   * @description A loading spinner directive with default
   * height and width of 50px.
   * @param {string} path - the framework base path
   * @returns {*} Spinner template
   * @example
   * <spinner></spinner>
   */
  function spinner(path) {
    return {
      templateUrl: path + 'widgets/spinner/spinner.html'
    };
  }

})();
