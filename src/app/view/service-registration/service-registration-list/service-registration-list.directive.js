(function () {
  "use strict";

  angular
    .module('app.view')
    .directive('serviceRegistrationList', serviceRegistrationList);

  serviceRegistrationList.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.serviceRegistrationList
   * @memberof app.view
   * @name serviceRegistrationList
   * @description A serviceRegistrationList directive
   * @param {string} path - the application base path
   * @returns {object} The serviceRegistrationList directive definition object
   */
  function serviceRegistrationList(path) {
    return {
      templateUrl: path + 'view/service-registration/service-registration-list/service-registration-list.html'
    };
  }

})();
