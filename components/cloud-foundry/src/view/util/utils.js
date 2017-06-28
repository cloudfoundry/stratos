(function () {
  'use strict';

  angular
    .module('cloud-foundry.view')
    .factory('cfUtilsService', cfUtilsService);

  /**
   * @namespace cfUtilsService
   * @memberof cloud-foundry.view
   * @name cfUtilsService
   * @description Various utility functions
   * @returns {object} the utils service
   */
  function cfUtilsService() {

    return {
      selectOptionMapping: selectOptionMapping
    };

    /**
     * @function selectOptionMapping
     * @memberOf cloud-foundry.view
     * @description domain mapping function
     * @param {object} o - an object to map
     * @returns {object} select-option object
     */
    function selectOptionMapping(o) {
      return {
        label: o.entity.name,
        value: o
      };
    }
  }
})();
