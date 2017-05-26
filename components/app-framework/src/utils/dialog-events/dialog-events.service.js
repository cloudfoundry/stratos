(function () {
  'use strict';

  angular
    .module('app.framework.utils')
    .factory('frameworkDialogEvents', dialogEventService);

  /**
   * @description Dialog Events Service
   * @returns {function} dialog events service
   */
  function dialogEventService() {

    var config = {
      scope: undefined,
      startEventName: 'MODAL_INTERACTION_START',
      endEventName: 'MODAL_INTERACTION_END'
    };

    var openCount = 0;

    function sendEvent(name) {
      if (config.scope) {
        config.scope.$broadcast(name);
      }
    }

    return {
      /**
       * @name configure
       * @description Confgiure the Dialog Events service
       * @param {object} configuration - configuration overrides
       */
      configure: function (configuration) {
        config = _.assign(config, configuration);
      },

      /**
       * @name notifyOpened
       * @description Notify the service that a dialog has been opened
       */
      notifyOpened: function () {
        if (openCount === 0) {
          sendEvent(config.startEventName);
        }
        openCount++;
      },

      /**
       * @name notifyClosed
       * @description Notify the service that a dialog has been closed
       */
      notifyClosed: function () {
        openCount--;
        if (openCount === 0) {
          sendEvent(config.endEventName);
        }
      }
    };
  }
})();
