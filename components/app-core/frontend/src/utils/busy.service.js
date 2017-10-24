(function () {
  'use strict';
  angular
    .module('app.utils')
    .factory('appBusyService', appBusyServiceFactory);

  /**
   * @namespace appBusyService
   * @memberof app.utils
   * @name appBusyService
   * @description The application busy service
   * @param {object} appEventService - the event service
   * @returns {object} the busy service
   */
  function appBusyServiceFactory($timeout) {

    // Time to wait before showing the progress indicator - if a close occurs in this time, no progress is shown
    // This prevents indicators being shown for quick operations
    var OPEN_TIMEOUT = 250;

    // Time period after the last close, where if a new progress indicator is requested, it will be shown immediately rather than obeying the open timeout
    // This prevents progress indicators flicking on and off when different ui-view's show and hide progress indicators
    var CLOSE_TIMEOUT = 500;

    var nextBusyId = 0;

    // Maintain a list of outstanding busy messages - only show the most recent
    var busyStack = [];

    var busyStates = {};

    var openTimer, closeTimer;

    return {

      busyState: {},

      _update: function () {
        if (busyStack.length === 0) {
          this.busyState.active = false;
          if (openTimer) {
            $timeout.cancel(openTimer);
            openTimer = undefined;
          } else {
            closeTimer = $timeout(function () {
              closeTimer = undefined;
            }, CLOSE_TIMEOUT);
          }
        } else {
          // Get the last item - that is the most recent
          var newestId = busyStack[busyStack.length - 1];
          var busyInfo = busyStates[newestId];
          this.busyState.label = busyInfo.label;
          this.busyState.local = busyInfo.local || false;

          if (!this.busyState.active && !openTimer) {
            if (closeTimer) {
              $timeout.cancel(closeTimer);
              closeTimer = undefined;
              this.busyState.active = true;
            } else {
              var that = this;
              openTimer = $timeout(function () {
                openTimer = undefined;
                that.busyState.active = true;
              }, OPEN_TIMEOUT);
            }
          }
        }
      },

      set: function (label, nonModal) {
        var id = nextBusyId;
        nextBusyId++;
        busyStates[id] = {
          id: id,
          label: label,
          local: nonModal || false
        };
        busyStack.push(id);
        this._update();
        return id;
      },

      clear: function (id) {
        if (busyStack.length === 0) {
          return;
        }
        var newestId = busyStack[busyStack.length - 1];
        delete busyStates[id];
        _.remove(busyStack, function (v) {
          return v === id;
        });

        // If we removed what was the newest, then we need to show the next newest, or hide the busy message if none left
        if (id === newestId) {
          this. _update();
        }
      }
    };
  }

})();
