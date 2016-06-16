(function () {
  'use strict';

  angular
    .module('app.view')
    .filter('prettyJson', prettyJson);

  /**
   * @namespace app.view.prettyJson
   * @memberof app.view
   * @name prettyJson
   * @description A filter that formats an object as prettified JSON
   * @returns {string} Prettified JSON as a string
   */
  function prettyJson() {
    return function (input) {
      return angular.toJson(input, true);
    };
  }

})();
