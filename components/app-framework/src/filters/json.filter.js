(function () {
  'use strict';

  // The filters
  angular.module('app.framework.filters')
    .filter('jsonString', jsonStringFilter);

  /**
   * @namespace app.framework.filters.jsonStringFilter
   * @memberof app.framework.filters
   * @name jsonStringFilter
   * @description An angular filter which will format the JSON object as a string OR show a supplied invalid message
   * @param {object} $filter - Angular $filter service
   * @returns {Function} The filter itself
   */
  function jsonStringFilter($filter) {
    var jsonStringFilter = function (obj, invalidMsg) {

      try {
        return angular.toJson(obj);
      } catch (e) {
        return $filter('translate')(invalidMsg) || '';
      }
    };

    // Ensure the filter is reapplied on change of language
    jsonStringFilter.$stateful = true;

    return jsonStringFilter;
  }

})();
