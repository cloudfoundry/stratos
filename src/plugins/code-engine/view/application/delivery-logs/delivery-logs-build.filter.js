(function () {
  'use strict';

  // The filters
  angular
    .module('code-engine.view.application.delivery-logs')
    .filter('ceDeliveryLogsBuildFilter', ceDeliveryLogsBuildFilter);

  /**
   * @name ceDeliveryLogsBuildFilter
   * @description An angular filter which wraps byProperties filter searching for specific properties. Used as a
   * workaround for smart-table's inability to restrict search to n columns (instead of all or nothing)
   * @param {object} $filter - the angular $filter service
   * @returns {Function} The filter itself
   */
  function ceDeliveryLogsBuildFilter($filter) {

    var searchProperties = ['message', 'result.label', 'reason.created_date', 'reason.author', 'reason.type'];

    return function (input, predicate) {
      return $filter('byProperties')(input, predicate.$, searchProperties);
    };
  }

})();
