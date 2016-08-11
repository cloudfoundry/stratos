(function () {
  'use strict';

  // The filters
  angular
    .module('cloud-foundry.view.applications.application.delivery-logs')
    .filter('deliveryLogsBuildFilter', deliveryLogsBuildFilter);

  deliveryLogsBuildFilter.$inject = [
    '$filter'
  ];

  /**
   * @name deliveryLogsBuildFilter
   * @description An angular filter which wraps byProperties filter searching for specific properties. Used as a
   * workaround for smart-table's inability to restrict search to n columns (instead of all or nothing)
   * @param {object} $filter - the angular $filter service
   * @returns {Function} The filter itself
   */
  function deliveryLogsBuildFilter($filter) {

    var searchProperties = ['message', 'result.label', 'reason.created_date', 'reason.author', 'reason.type'];

    return function (input, predicate) {
      return $filter('byProperties')(input, predicate.$, searchProperties);
    };
  }

})();
