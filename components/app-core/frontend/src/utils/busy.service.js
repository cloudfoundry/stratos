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
  function appBusyServiceFactory() {

    var nextBusyId = 0;

    // Maintain a list of outstanding busy messages - only show the most recent
    var busyStack = [];

    var busyStates = {};

    return {

      busyState: {},

      _update: function () {
        if (busyStack.length === 0) {
          this.busyState.active = false;
        } else {
          // Get the last item - that is the most recent
          var newestId = busyStack[busyStack.length - 1];
          var busyInfo = busyStates[newestId];
          this.busyState.label = busyInfo.label;
          this.busyState.local = busyInfo.local || false;
          this.busyState.active = true;
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
