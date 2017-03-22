(function () {
  'use strict';

  angular
    .module('app.view')
    .filter('smallToLargeIcon', appStateIcon);

  /**
   * @namespace app.view.smallToLargeIcon
   * @memberof app.view
   * @name smallToLargeIcon
   * @description converts helion-icon-<text>_S to helion-icon-<text>_L
   * @returns {function} The filter function
   */
  function appStateIcon() {
    return function (input) {
      if (_.isNil(input)) {
        return '';
      }

      return input.replace('_S', '_L');

    };
  }

})();
