(function () {
  'use strict';

  /**
   * @namespace app.model
   * @memberof app
   * @name model
   * @description The model layer of the UI platform that contains
   * the business data objects and methods to retrieve/update the
   * data
   */
  angular
    .module('app.model', [])
    .factory('loginManager', loginManagerFactory);

  /**
   * @namespace app.model.loginManager
   * @memberof app.model
   * @name app.model.loginManager
   * @description Allows login to be disabled
   * @returns {object} The login manager service
   */
  function loginManagerFactory() {
    var enabled = true;

    return {
      isEnabled: isEnabled,
      setEnabled: setEnabled
    };

    /**
     * @function isEnabled
     * @memberof app.model.loginManager
     * @returns {boolean} is login enabled
     */
    function isEnabled() {
      return enabled;
    }

    /**
     * @function retrieve
     * @memberof app.model.loginManager
     * @param {boolean} flag - is login enabled
     */
    function setEnabled(flag) {
      enabled = flag;
    }
  }
})();
