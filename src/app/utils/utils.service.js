(function () {
  'use strict';

  angular
    .module('app.utils')
    .factory('app.utils.utilsService', utilsServiceFactory);

  utilsServiceFactory.$inject = [
  ];

  /**
   * @namespace app.utils.utilsService
   * @memberof app.utils
   * @name utilsService
   * @description Various utility functions
   * @returns {object} the utils service
   */
  function utilsServiceFactory() {
    return {
      mbToHumanSize: mbToHumanSize
    };

    function mbToHumanSize(sizeMb) {
      if (angular.isUndefined(sizeMb)) {
        return '';
      }
      if (sizeMb === -1) {
        return '∞';
      }
      if (sizeMb > 1048576) {
        return (sizeMb / 1048576).toFixed(1) + ' TB';
      }
      if (sizeMb > 1024) {
        return (sizeMb / 1024).toFixed(1) + ' GB';
      }
      return sizeMb + ' MB';
    }
  }

})();
