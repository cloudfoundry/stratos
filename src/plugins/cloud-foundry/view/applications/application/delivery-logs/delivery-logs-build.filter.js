(function() {
  'use strict';

  // The filters
  angular.module('cloud-foundry.view.applications.application.delivery-logs')
    .filter('deliveryLogsBuildFilter', deliveryLogsBuildFilter);

  deliveryLogsBuildFilter.$inject = [
    '$filter'
  ];

  /**
   * @namespace cloud-foundry.view.applications.application.delivery-logs.deliveryLogsBuildFilter
   * @memberof cloud-foundry.view.applications.application.delivery-logs
   * @name deliveryLogsBuildFilter
   * @description An angular filter which wraps byProperties filter searching for specific properties. Used as a
   * workaround for smart-table's inability to restrict search to n columns (instead of all or nothing)
   * @returns {Function} The filter itself
   */
  function deliveryLogsBuildFilter($filter) {

    var searchProperties = ['message', 'result.label', 'reason.createdDate', 'reason.author', 'reason.type'];

    return function(input, predicate) {
      return $filter('byProperties')(input, predicate.$, searchProperties);
    };
  }

})();
