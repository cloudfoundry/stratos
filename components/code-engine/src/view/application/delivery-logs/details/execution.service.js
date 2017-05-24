(function () {
  'use strict';

  /**
   * @name code-engine.view.application.delivery-logs.ceExecutionDetailView
   * @description Service for viewing an execution, specifically the list of events
   **/
  angular
    .module('code-engine.view.application.delivery-logs')
    .factory('ceExecutionDetailView', ceExecutionDetailView);

  function ceExecutionDetailView(frameworkDetailView, ceEventDetailView) {
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
      open: function (execution, events, cnsiGuid) {
        return frameworkDetailView({
          templateUrl: 'plugins/code-engine/view/application/delivery-logs/details/execution.html',
          title: execution.message
        }, {
          guid: cnsiGuid,
          execution: execution,
          events: events,
          viewEvent: ceEventDetailView.open
        }).result;
      }
    };
  }

})();
