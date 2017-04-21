(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('appNotificationsService', notificationsFactory);

  /**
   * @memberof app.view
   * @name appNotificationsService
   * @description A notifications service
   * @param {object} $interpolate - the angular $interpolate service
   * @param {app.utils.appEventService} appEventService - the application event bus service
   * @param {helion.framework.widgets.frameworkToaster} frameworkToaster - the toast service
   * @returns {object} A service instance factory
   */
  function notificationsFactory($interpolate, appEventService, frameworkToaster) {
    var service = {
      /**
       * @function notify
       * @memberof appNotificationsService
       * @description Show a toast notification
       * @param {string} toastType - the toast notification type (i.e. success, warning)
       * @param {string} message - the toast message
       * @param {object=} interpolateScope - optional scope used for interpolating message
       * @param {object=} toastOptions - optional override options for toast
       * @returns {object} The toast object
       * @public
       */
      notify: function (toastType, message, interpolateScope, toastOptions) {

        var interpolatedMessage;
        if (interpolateScope) {
          // Escape possible HTML properties in interpolateScope
          _.forEach(interpolateScope, function (val, key) {
            if (_.isString(val)) {
              interpolateScope[key] = _.escape(val);
            }
          });
          interpolatedMessage = $interpolate(message)(interpolateScope);
        } else {
          interpolatedMessage = message;
        }
        switch (toastType) {
          case 'busy':
            return frameworkToaster.busy(interpolatedMessage, toastOptions);
          case 'error':
            return frameworkToaster.error(interpolatedMessage, toastOptions);
          case 'success':
            return frameworkToaster.success(interpolatedMessage, toastOptions);
          case 'warning':
            return frameworkToaster.warning(interpolatedMessage, toastOptions);
          default:
            return frameworkToaster.show(interpolatedMessage, toastType, toastOptions);
        }
      }
    };

    appEventService.$on('events.NOTIFY', function (event, config) {
      service.notify(config.toastType, config.message, config.scope, config.options);
    });
    appEventService.$on('events.NOTIFY_BUSY', function (event, config) {
      service.notify('busy', config.message, config.scope, config.options);
    });
    appEventService.$on('events.NOTIFY_ERROR', function (event, config) {
      service.notify('error', config.message, config.scope, config.options);
    });
    appEventService.$on('events.NOTIFY_SUCCESS', function (event, config) {
      service.notify('success', config.message, config.scope, config.options);
    });
    appEventService.$on('events.NOTIFY_WARNING', function (event, config) {
      service.notify('warning', config.message, config.scope, config.options);
    });

    return service;
  }

})();
