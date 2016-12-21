(function () {
  'use strict';

  angular
    .module('app.view')
    .filter('appStateIcon', appStateIcon);

  /**
   * @namespace app.view.appStateIcon
   * @memberof app.view
   * @name appStateIcon
   * @description An app status filter that returns classes
   * for a status icon based on the status string input
   * @returns {function} The filter function
   */
  function appStateIcon() {
    return function (input) {
      if (_.isNil(input)) {
        return '';
      }

      var icon = '';
      switch (input) {
        case 'STARTED':
          icon = 'helion-icon-Active_S text-success';
          break;
        case 'STOPPED':
          icon = 'helion-icon-Critical_S text-danger';
          break;
        case 'ok':
          icon = 'helion-icon-Active_S text-success';
          break;
        case 'tentative':
          icon = 'helion-icon-Active_S text-tentative';
          break;
        case 'warning':
          icon = 'helion-icon-Warning_S text-warning';
          break;
        case 'error':
          icon = 'helion-icon-Critical_S text-danger';
          break;
        default:
          icon = '';
      }

      return icon;
    };
  }

})();
