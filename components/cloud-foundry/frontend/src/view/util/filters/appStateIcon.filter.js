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
          icon = 'app-status-icon-ok text-success';
          break;
        case 'STOPPED':
          icon = 'app-status-icon-warning text-danger';
          break;
        case 'ok':
          icon = 'app-status-icon-ok text-success';
          break;
        case 'tentative':
          icon = 'app-status-icon-ok text-tentative';
          break;
        case 'warning':
          icon = 'app-status-icon-warning text-warning';
          break;
        case 'error':
          icon = 'app-status-icon-error text-danger';
          break;
        case 'deleted':
          icon = 'app-status-icon-delete text-success';
          break;
        case 'busy':
          icon = 'app-status-icon-busy';
          break;
        default:
          icon = '';
      }

      return icon;
    };
  }

})();
