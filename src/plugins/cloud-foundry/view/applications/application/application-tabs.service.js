(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application')
    .factory('cfApplicationTabs', ApplicationTabs);

  /**
   * @name cfApplicationTabs
   * @description Provides collection of configuration objects for tabs on the application page
   * @param {object} $q - the Angular $q service
   * @returns {object} The cfApplicationTabs object
   */
  function ApplicationTabs($q) {
    var service = {
      tabs: [ ],
      callAppTabs: callAppTabs,
      clearState: clearState,
      appUpdated: appUpdated,
      appDeleting: appDeleting,
      appDeleted: appDeleted
    };

    return service;

    function callAppTabs(method) {
      var tasks = [];
      var args = Array.prototype.slice.call(arguments, 1);
      _.forEach(service.tabs, function (tab) {
        var promise = _safeCallFunction.apply(tab, [tab, tab[method]].concat(args));
        tasks.push(promise || $q.resolve());
      });
      return $q.all(tasks);
    }

    function clearState() {
      return callAppTabs.apply(service, ['clearState']);
    }

    function appUpdated(cnsiGuid, refresh) {
      return callAppTabs.apply(service, ['appUpdated', cnsiGuid, refresh]);
    }

    function appDeleting() {
      return callAppTabs.apply(service, ['appDeleting']);
    }

    function appDeleted() {
      return callAppTabs.apply(service, ['appDeleted']);
    }

    function _safeCallFunction(tab, func) {
      return angular.isFunction(func) ? func.apply(tab, _.slice(arguments, 2)) : $q.resolve;
    }

  }

})();
