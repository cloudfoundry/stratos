(function () {
  'use strict';

  /**
   * @name cloud-foundry.view.applications.application.delivery-logs.viewExecutionFactory
   * @description Service for viewing an execution, specifically the list of events
   **/
  angular
    .module('cloud-foundry.view.applications.application.delivery-logs')
    .factory('viewExecutionFactory', viewExecutionFactory);

  viewExecutionFactory.$inject = [
    'helion.framework.widgets.detailView',
    'viewEventFactory'
  ];

  function viewExecutionFactory(detailView, viewEventFactory) {
    return {
      /**
       * @function open
       * @description Open a detail-view showing execution details, specifically list of events
       * @param {object} execution - execution information
       * @param {array} events - list of events associated with the execution
       * @param {string} cnsiGuid - required to allow execution's events to be viewed
       * @returns {object} The resolved/rejected promise
       * @public
       **/
      open: function(execution, events, cnsiGuid) {
        return detailView({
          templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-logs/details/execution.html',
          title: execution.message
        }, {
          guid: cnsiGuid,
          execution: execution,
          events: events,
          viewEvent: viewEventFactory.open
        }).result;
      }
    };
  }

})();
