(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application')
    .factory('cfApplicationTabs', ApplicationTabs);

  /**
   * @name cfApplicationTabs
   * @description Provides collection of configuration objects for tabs on the application page
   * @param {object} $q - the Angular $q service
   * @param {object} $state - the Angular $state service
   * @param {object} $stateParams - the Angular $stateParams service
   * @param {modelManager} modelManager - the Model management service
   * @returns {object} The cfApplicationTabs object
   */
  function ApplicationTabs($q, $state, $stateParams, modelManager) {
    var service = {
      tabs: [ ],
      callAppTabs: callAppTabs
    };

    return service;

    function _safeCallFunction(tab, func) {
      if (angular.isFunction(func)) {
        return func.apply(tab, _.slice(arguments, 2));
      }
    }

    function callAppTabs(method) {
      var tasks = [];
      var args = Array.prototype.slice.call(arguments);
      _.forEach(service.tabs, function (tab) {
        var promise = _safeCallFunction.apply(tab, [tab, tab[method]].concat(args.slice(1)));
        tasks.push(promise || $q.resolve());
      });
      return $q.all(tasks);
    }

  }

})();
