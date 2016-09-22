(function () {
  'use strict';

  angular
    .module('app.logged-in')
    .factory('app.logged-in.loggedInService', loggedInServiceFactory);

  loggedInServiceFactory.$inject = [
    'app.event.eventService',
    'app.model.modelManager',
    'helion.framework.widgets.dialog.confirm',
    '$interval',
    '$interpolate',
    '$rootScope',
    '$window',
    '$log'
  ];

  /**
   * @namespace app.loggedIn.loggedInService
   * @memberof app.loggedIn
   * @name loggedInServiceFactory
   * @param {object} eventService - Event Service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} confirmDialog - the confirmation dialog service
   * @param {object} $interval - the angular $interval Service
   * @param {object} $interpolate - the angular $interpolate Service
   * @param {object} $rootScope - the angular $rootScope Service
   * @param {object} $window - the angular $window Service
   * @param {object} $log - the angular $log Service
   * @returns {object} Logged In Service
   */
  function loggedInServiceFactory(eventService, modelManager, confirmDialog,
                                  $interval, $interpolate, $rootScope, $window, $log) {

    var loggedIn = false;
    var lastUserInteraction = moment();
    var accountModel = modelManager.retrieve('app.model.account');
    var sessionChecker, dialog;

    var warnBeforeLogout = 2 * 60 * 1000; // warn user 2 minutes before logout

    // Avoid a race condition where the cookie is deleted if the user presses ok just before expiration
    var autoLogoutDelta = 5 * 1000;

    // User considered idle if no interaction for 5 minutes
    var userIdlePeriod = 5 * 60 * 1000;

    var activityPromptShown = false;

    function logout() {
      $log.debug('Logging out');
      return accountModel.logout().finally(function () {
        $log.debug('Reloading page');
        $window.location = '/';
      });
    }

    function promptInactiveUser(expiryDate) {
      var scope = $rootScope.$new();
      scope.moment = moment;

      var skipDigest = false;
      var digestInterval = $interval(function () {}, 100);
      activityPromptShown = true;

      scope.getExpiryDuration = function () {
        if (skipDigest) {
          return '';
        }
        var delta = expiryDate.diff(moment());
        if (delta < 0) {
          delta = 0;
          skipDigest = true; // prevent further digests while we logout and reload
          dialog.dismiss();
          logout();
        }
        return moment.duration(delta).format('m[m] s[s]');
      };

      dialog = confirmDialog({
        title: gettext('Are you still there?'),
        description: function () {
          return gettext('You have been inactive for a while. For your protection, ' +
              'we will automatically log you out in') + ' ' + $interpolate('{{ getExpiryDuration() }}')(scope);
        },
        moment: moment,
        hideNo: true,
        buttonText: {
          yes: gettext('I am still here')
        }
      });
      dialog.result
        .then(function () {
          $log.debug('User is still here! Automatically refresh session');
          return accountModel.verifySession().catch(function (error) {
            // If we fail to refresh, logout!
            $log.error('Failed to refreshed Session!', error);
            logout();
          });
        })
        .finally(function () {
          $interval.cancel(digestInterval);
          activityPromptShown = false;
        });
    }

    function checkSession() {
      if (activityPromptShown) {
        return;
      }
      var now = moment();
      var sessionExpiresOn = accountModel.accountData.sessionExpiresOn;
      var safeExpire = moment(sessionExpiresOn).subtract(moment.duration(autoLogoutDelta));
      var delta = safeExpire.diff(now);
      var aboutToExpire = delta < warnBeforeLogout;

      if (aboutToExpire) {
        var idleDelta = now.diff(lastUserInteraction);
        var userIsActive = idleDelta < userIdlePeriod;
        if (userIsActive) {
          accountModel.verifySession().catch(function (error) {
            // If we fail to refresh, logout!
            $log.error('Failed to refreshed Session!', error);
            logout();
          });
        } else {
          promptInactiveUser(safeExpire);
        }
      }
    }

    eventService.$on(eventService.events.LOGIN, function () {
      loggedIn = true;
      sessionChecker = $interval(checkSession, 30000);
    });

    eventService.$on(eventService.events.LOGOUT, function () {
      loggedIn = false;
      if (angular.isDefined(sessionChecker)) {
        $interval.cancel(sessionChecker);
        sessionChecker = undefined;
      }
    });

    return {
      isLoggedIn: isLoggedIn,
      userInteracted: userInteracted
    };

    function isLoggedIn() {
      return loggedIn;
    }

    function userInteracted() {
      lastUserInteraction = moment();
    }

  }

})();
