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
        switch (input) {
          case 'OK':
            icon = 'helion-icon-Active_L text-primary';
            break;
          case 'ERROR':
            icon = 'helion-icon-Critical_L text-danger';
            break;
          default:
            icon = 'helion-icon-Unknown_L';
        }

        return '<span class="helion-icon helion-icon-lg ' + icon + '"></span>';
      }

      return '';
    };
  }

})();
