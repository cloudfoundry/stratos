(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster')
    .factory('cfClusterTabs', ClusterTabs);

  /**
   * @name cfClusterTabs
   * @description Provides collection of configuration objects for tabs on the cluster, org and space pages
   * @param {object} $q - the Angular $q service
   * @returns {object} The cfClusterTabs service
   */
  function ClusterTabs($q, $stateParams, modelManager) {

    var service = {
      clusterTabs: [ ],
      orgTabs: [],
      spaceTabs: [],
      isAdmin: isAdmin,
      callTabs: callTabs
    };

    return service;

    //TODO: Comment convienence + safety + timining (need on demand not available at register time)
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
