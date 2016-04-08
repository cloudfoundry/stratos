(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('clusterRegistrationList', clusterRegistrationList);

  clusterRegistrationList.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.clusterRegistrationList
   * @memberof app.view
   * @name clusterRegistrationList
   * @description A clusterRegistrationList directive
   * @param {string} path - the application base path
   * @returns {object} The clusterRegistrationList directive definition object
   */
  function clusterRegistrationList(path) {
    return {
      templateUrl: path + 'view/cluster-registration/cluster-registration-list/cluster-registration-list.html'
    };
  }

})();
