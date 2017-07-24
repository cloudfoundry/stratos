(function () {
  'use strict';

  angular
    .module('cloud-foundry.service')
    .factory('cfTabs', CfClusterTabs);

  /**
   * @name cfTabs
   * @description Provides collection of configuration objects for tabs on the cluster, org and space pages
   * @param {object} $q - the Angular $q service
   * @param {object} $stateParams - the Angular $stateParams service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @returns {object} The cfTabs service
   */
  function CfClusterTabs($q, $stateParams, modelManager) {

    return {
      applicationTabs: [],
      clusterTabs: [ ],
      orgTabs: [],
      spaceTabs: [],
      isAdmin: isAdmin,
      callTabs: callTabs
    };

    /**
     * @function isAdmin
     * @description Convenience method to safely fetch the cf user's admin status
     * @returns {boolean} True if user connected to cluster is an admin
     */
    function isAdmin() {
      var consoleInfo = modelManager.retrieve('app.model.consoleInfo');
      if (consoleInfo.info &&
        consoleInfo.info.endpoints &&
        consoleInfo.info.endpoints.cf[$stateParams.guid] &&
        consoleInfo.info.endpoints.cf[$stateParams.guid].user) {
        return consoleInfo.info.endpoints.cf[$stateParams.guid].user.admin;
      }
      return false;
    }

    function callTabs(tabTypes, method) {
      var tasks = [];
      var args = Array.prototype.slice.call(arguments, 2);
      _.forEach(tabTypes, function (tabType) {
        _.forEach(tabType, function (tab) {
          var promise = _safeCallFunction.apply(tab, [tab, tab[method]].concat(args));
          tasks.push(promise || $q.resolve());
        });
      });

      return $q.all(tasks);
    }

    function _safeCallFunction(tab, func) {
      return angular.isFunction(func) ? func.apply(tab, _.slice(arguments, 2)) : $q.resolve;
    }

  }

})();
