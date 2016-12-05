(function () {
  'use strict';

  angular
  .module('app.view')
  .factory('app.view.localStorage', localStorageFactory);

  localStorageFactory.$inject = ['$window'];

  /**
  * @namespace app.view.localStorageFactory
  * @memberof app.view
  * @name app.model.localStorageFactory
  * @param {object} $window - the Angular $window service
  * @description This service provides access to the local storage facility of the web browser.
  * @returns {object} The local storage service
  */
  function localStorageFactory($window) {

    // Check if local storage is supported
    var supported;
    try {
      if ($window.localStorage) {
        $window.localStorage.setItem('_localStorageCheck', '_localStorageCheck');
        $window.localStorage.removeItem('_localStorageCheck');
      }
      supported = true;
    } catch (err) {
      supported = false;
    }

    return {
      /**
       * @function isSupported
       * @memberof app.view.localStorage
       * @description Checks if local storage is supported by the browser
       * @returns {boolean} Flag indicating local storage is supported
       */
      isSupported: function () {
        return supported;
      },

      /**
       * @function setItem
       * @memberof app.view.localStorage
       * @description Set the item in the local storage for the given key
       * @param {string} key - key to store the value under
       * @param {string} value - value to be stored
       */
      setItem: function (key, value) {
        if (supported) {
          $window.localStorage.setItem(key, value);
        }
      },

      /**
       * @function removeItem
       * @memberof app.view.localStorage
       * @description Remove the item in the local storage with the given key
       * @param {string} key - key to store the value under
       */
      removeItem: function (key) {
        if (supported) {
          $window.localStorage.removeItem(key);
        }
      },

      /**
       * @function getItem
       * @memberof app.view.localStorage
       * @description Get the item in the local storage for the given key. Optioanlly return the default value if not found.
       * @param {string} key - key of value fo retrieve
       * @param {string=} defaultValue - default value to be returned if no value is found
       * @returns {string} value from local storage for the given key
       */
      getItem: function (key, defaultValue) {
        if (supported) {
          var value = $window.localStorage.getItem(key);
          return angular.isUndefined(value) ? defaultValue : value;
        } else {
          return defaultValue;
        }
      }
    };
  }

})();
