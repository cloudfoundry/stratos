(function () {
  'use strict';

  angular
    .module('app.view')
    .filter('serviceStatus', serviceStatus);

  /**
   * @namespace app.view.serviceStatus
   * @memberof app.view
   * @name serviceStatus
   * @description A service status filter that returns a HTML
   * markup for a status icon based on the status string input
   * @returns {function} The filter function
   */
  function serviceStatus() {
    return function (input) {
      if (angular.isDefined(input)) {
        var icon = '';
        var textClass = '';
        switch (input) {
          case 'OK':
            icon = 'check_circle';
            textClass = 'text-primary';
            break;
          case 'ERROR':
            icon = 'cancel';
            textClass = 'text-danger';
            break;
          default:
            icon = 'help_outline';
        }

        return '<span class="material-icons app-icon-lg ' + textClass + '">' + icon + '</span>';
      }

      return '';
    };
  }

})();
