(function () {
  "use strict";

  angular
    .module('app.view')
    .directive('serviceRegistrationMessageBox', serviceRegistrationMessageBox);

  serviceRegistrationMessageBox.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.serviceRegistrationMessageBox
   * @memberof app.view
   * @name serviceRegistrationMessageBox
   * @description A serviceRegistrationMessageBox directive
   * @param {string} path - the application base path
   * @returns {object} The serviceRegistrationMessageBox directive definition object
   */
  function serviceRegistrationMessageBox(path) {
    return {
      templateUrl: path + 'view/service-registration/service-registration-message-box/service-registration-message-box.html'
    };
  }

})();
