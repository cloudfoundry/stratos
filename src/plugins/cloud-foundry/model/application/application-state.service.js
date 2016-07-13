(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.application
   * @memberOf cloud-foundry.model
   */
  angular
    .module('cloud-foundry.model')
    .factory('cloud-foundry.model.application.stateService', stateServiceFactory);

  stateServiceFactory.$inject = [];

  /**
   * @function stateServiceFactory
   * @memberof cloud-foundry.model.application
   * @description Service to map app states to user-friendly state names, presentation and actions.
   * @returns {object} The Application State Service
   */
  function stateServiceFactory() {
    /**
     * State metadata - Codifies the state table here:
     * https://wiki.hpcloud.net/display/iaas/App+Lifecycle+State+Diagram
     *
     * First level keys match the APP_STATE with a '?' for a wildcard match for any APP_STATE
     * Second level keys match PACKAGE_STATE directly OR on a combination of #running #crashed, #flapping
     * which we presentation in the name as (X,X,X) - where X can be:
     *   - 0 - must be 0
     *   - N - must be >0
     *   - ? - matches when the value is not known
     */
    var stateMetadata = {
      '?': {
        FAILED: {
          label: gettext('Staging Failed'),
          indicator: 'error'
        }
      },
      PENDING: {
        '?': {
          label: gettext('Pending'),
          indicator: 'busy'
        }
      },
      LOADING: {
        '?': {
          label: gettext('Loading'),
          indicator: 'busy'
        }
      },
      STOPPED: {
        PENDING: {
          label: gettext('Offline while Updating'),
          indicator: 'warning'
        },
        STAGED: {
          label: gettext('Offline'),
          indicator: 'warning'
        },
        '*NONE*': {
          label: gettext('Incomplete'),
          indicator: 'warning'
        }
      },
      STARTED: {
        PENDING: {
          label: gettext('Staging App'),
          indicator: 'busy'
        },
        'STAGED(0,0,0)': {
          label: gettext('Starting App'),
          indicator: 'busy'
        },
        'STAGED(N,0,0)': {
          label: gettext('Online'),
          indicator: 'ok'
        },
        'STAGED(0,N,0)': {
          label: gettext('Crashed'),
          indicator: 'error'
        },
        'STAGED(0,0,N)': {
          label: gettext('Crashing'),
          indicator: 'error'
        },
        'STAGED(0,N,N)': {
          label: gettext('Crashing'),
          indicator: 'error'
        },
        'STAGED(N,N,0)': {
          label: gettext('Partially Online'),
          indicator: 'warning'
        },
        'STAGED(N,0,N)': {
          label: gettext('Partially Online'),
          indicator: 'warning'
        }
      }
    };

    // This service supports a single 'get' method
    return {
      get: get
    };

    /**
     * @function get
     * @memberof cloud-foundry.model.application.stateService
     * @description Get the application state metadata for an application based on its summary and
     * optionally its instance metadata.
     * @param {object} summary - the application summary metadata (either from summary or entity)
     * @param {object} appInstances - the application instances metadata (from the app stats API call)
     * @returns {object} Object representing the state metadata for the application
     */
    function get(summary, appInstances) {
      var appState = summary ? summary.state : 'UNKNOWN';
      var pkgState = (summary ? summary.package_state : '') || '*NONE*';
      var wildcard = stateMetadata['?'];

      // App state wildcard match, just match on package state
      if (wildcard && wildcard[pkgState]) {
        return wildcard[pkgState];
      }

      var appStateMatch = stateMetadata[appState];
      if (appStateMatch) {
        if (appStateMatch[pkgState]) {
          return appStateMatch[pkgState];
        } else {
          // Check if we have a wildcard pkg match
          if (appStateMatch['?']) {
            return appStateMatch['?'];
          } else {
            // Need to check based on additional state
            // Note that the app summary returned when we are getting all apps does not report running_instances
            var running = getCount(summary.running_instances, appInstances, 'RUNNING');
            var crashed, flapping;
            // If we know how many aer running and this is the same as the total # instances then
            // this implies that #crashed and #flapping are 0, so we can skip needing to use app instance metadata
            if (running === summary.instances) {
              crashed = 0;
              flapping = 0;
            } else {
              crashed = getCount(undefined, appInstances, 'CRASHED');
              if (crashed >= 0) {
                flapping = summary.instances - crashed - running;
              } else {
                // If we couldn't determine #crashed, then we can't calculate #flapping
                flapping = -1;
              }
            }

            var extState = pkgState + '(' +
              formatCount(running) + ',' +
              formatCount(crashed) + ',' +
              formatCount(flapping) + ')';
            if (appStateMatch[extState]) {
              return appStateMatch[extState];
            }
          }
        }
      }

      // No match against the state table, so return unknown
      return {
        label: gettext('Unknown'),
        indicator: 'error'
      };
    }

    /**
     * @function getCount
     * @memberof cloud-foundry.model.application.stateService
     * @description Get a count either from a value if supplied or by filterine app instance metadata
     * @param {number} value - the value to use directly or undefined if not available
     * @param {object} appInstances - the application instances metadata (from the app stats API call)
     * @param {string} instanceState - the instance state to use when filtering the app instance metadata
     * @returns {number} Count of instances in the desired state
     */
    function getCount(value, appInstances, instanceState) {
      // Use a value if one available
      if (angular.isDefined(value)) {
        return value;
      } else if (appInstances) {
        // Calculate form app instance metadata if available
        return _.filter(appInstances, function (s) { return s.state === instanceState; }).length;
      } else {
        // No value given and no instance data available, so return -1 to represent unknown
        return -1;
      }
    }

    /**
     * @function formatCount
     * @memberof cloud-foundry.model.application.stateService
     * @description Format a numeric count into a string to be used for state matching
     * @param {number} value - the value to use directly or undefined if not available
     * @returns {string} String representation of value for state matching
     */
    function formatCount(value) {
      if (value === 0) {
        return '0';
      } else if (value > 0) {
        return 'N';
      } else {
        return '?';
      }
    }
  }
})();
