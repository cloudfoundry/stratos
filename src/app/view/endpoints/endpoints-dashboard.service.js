(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .factory('appEndpointsDashboardService', appEndpointsDashboardService);

  /**
   * @namespace app.view.endpoints.dashboard.appEndpointsDashboardService
   * @memberof app.view.endpoints.dashboard
   * @name appEndpointsDashboardService
   * @param {object} $q - the Angular $q service
   * @returns {object} Endpoints Dashboard Service
   */
  function appEndpointsDashboardService($q) {

    var endpoints = [];
    var endpointsProviders = [];

    return {
      endpoints: endpoints,
      endpointsProviders: endpointsProviders,
      clear: clear,
      refreshFromCache: refreshFromCache,
      update: updateEndpoints
    };

    function clear() {
      return _callForAllProviders('clear').then(function () {
        endpoints.length = 0;
      });
    }

    function refreshFromCache() {
      return clear()
        .then(function () {
          return _haveCachedEndpoints();
        })
        .then(function (haveCachedEndpoints) {
          if (haveCachedEndpoints) {
            // serviceInstanceModel has previously been updated
            // to decrease load time, we will use that data.
            // we will still refresh the data asynchronously and the UI will update to reflect changes
            return _updateEndpointsFromCache();
          }
        });
    }

    /**
     * @function _updateEndpoints
     * @memberOf app.view.endpoints.dashboard
     * @description update the models supporting the endpoints dashboard and refresh the local endpoints list
     * @returns {object} a promise
     * @private
     */
    function updateEndpoints() {
      return _callForAllProviders('updateInstances').then(function () {
        return _updateEndpointsFromCache();
      });
    }

    /*
     * Call method on all service providers, forwarding the passed arguments
     * If the called method returns a promise, we return a $q.all() on all the returned promises,
     * otherwise we return a promise with an array of the returned values
     * */
    function _callForAllProviders(method) {
      Array.prototype.shift.apply(arguments);

      var values = [];
      var isPromise = null;

      for (var i = 0; i < endpointsProviders.length; i++) {
        if (!angular.isFunction(endpointsProviders[i][method])) {
          throw new Error('callForAllProviders: service provider does not implement method: ' + method);
        }
        var ret = endpointsProviders[i][method].apply(this, arguments);
        if (ret && angular.isFunction(ret.then)) {
          if (isPromise === null) {
            isPromise = true;
          } else if (!isPromise) {
            throw new Error('callForAllProviders: Cannot mix promise and value returning functions');
          }
          values.push(ret);
        } else {
          if (isPromise === null) {
            isPromise = false;
          } else if (isPromise) {
            throw new Error('callForAllProviders: Cannot mix promise and value returning functions');
          }
          values.push(ret);
        }
      }
      return isPromise ? $q.all(values) : $q.resolve(values);
    }

    function _updateEndpointsFromCache() {
      return _callForAllProviders('createEndpointEntries').then(function () {
        // Pre-sort the array to avoid initial smart-table flicker
        endpoints.sort(function (e1, e2) {
          return e1.type !== e2.type ? e1.type.localeCompare(e2.type) : e1.name.localeCompare(e2.name);
        });
      });
    }

    function _haveCachedEndpoints() {
      return _callForAllProviders('haveInstances').then(function (ret) {
        for (var i = 0; i < ret.length; i++) {
          if (ret[i]) {
            return true;
          }
        }
        return false;
      });
    }

  }

})();
