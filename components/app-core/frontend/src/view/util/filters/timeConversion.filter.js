(function () {
  'use strict';

  angular
    .module('app.view')
    .filter('secondsToMs', secondsToMs);

  /**
   * @namespace app.view.secondsToMs
   * @memberof app.view
   * @name secondsToMs
   * @description A filter to convert seconds to milliseconds
   * @returns {function} The filter function
   */
  function secondsToMs() {
    return function (input) {
      if (!_.isNil(input) && _.isNumber(input)) {
        return input * 1000;
      }
      return null;
    };
  }

})();
