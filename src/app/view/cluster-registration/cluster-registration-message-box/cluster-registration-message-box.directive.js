(function () {
  "use strict";

  angular
    .module('app.view')
    .directive('clusterRegistrationMessageBox', clusterRegistrationMessageBox);

  clusterRegistrationMessageBox.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.clusterRegistrationMessageBox
   * @memberof app.view
   * @name clusterRegistrationMessageBox
   * @description A clusterRegistrationMessageBox directive
   * @param {string} path - the application base path
   * @returns {object} The clusterRegistrationMessageBox directive definition object
   */
  function clusterRegistrationMessageBox(path) {
    return {
      templateUrl: path + 'view/cluster-registration/cluster-registration-message-box/cluster-registration-message-box.html'
    };
  }

})();
