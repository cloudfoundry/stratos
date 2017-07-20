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
  function ClusterTabs($q) {

    var exampleTab = {
      // position: 8,
      // hide: function () {
      //   var cnsiGuid = $stateParams.cnsiGuid;
      //   var cnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
      //   return !cfUtilsService.hasSshAccess(cnsiModel.serviceInstances[cnsiGuid]);
      // },
      // uiSref: 'cf.applications.application.ssh',
      // label: 'cf.app-ssh',
    };

    var service = {
      clusterTabs: [ ],
      orgTabs: [],
      spaceTabs: [],
      callTabs: callTabs
    };

    return service;

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
