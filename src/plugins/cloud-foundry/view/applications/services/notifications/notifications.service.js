(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.services')
    .factory('cloud-foundry.view.applications.services.notifications', notificationsFactory);

  notificationsFactory.$inject = [
    'app.event.eventService',
    'helion.framework.widgets.toaster'
  ];

  /**
   * @memberof cloud-foundry.view.applications.services
   * @name notifications
   * @description A notifications service
   * @param {app.event.eventService} eventService - the application event bus service
   * @param {helion.framework.widgets.toaster} toaster - the toast service
   * @returns {object} A service instance factory
   */
  function notificationsFactory(eventService, toaster) {
    var service = {
      /**
       * @function notify
       * @memberof cloud-foundry.view.applications.services.notifications
       * @description Show a toast notification
       * @param {string} toastType - the toast notification type (i.e. success, warning)
       * @param {string} message - the toast message
       * @param {object} options - optional override options for toast
       * @returns {object} The toast object
       * @public
       */
      notify: function (toastType, message, options) {
        switch (toastType) {
          case 'busy':
            return toaster.busy(message, options);
          case 'error':
            return toaster.error(message, options);
          case 'success':
            return toaster.success(message, options);
          case 'warning':
            return toaster.warning(message, options);
          default:
            return toaster.show(message, toastType, options);
        }
      }
    };

    eventService.$on('cf.events.NOTIFY', function (event, config) {
      service.notify(config.toastType, config.message, config.options);
    });
    eventService.$on('cf.events.NOTIFY_BUSY', function (event, config) {
      service.notify('busy', config.message, config.options);
    });
    eventService.$on('cf.events.NOTIFY_ERROR', function (event, config) {
      service.notify('error', config.message, config.options);
    });
    eventService.$on('cf.events.NOTIFY_SUCCESS', function (event, config) {
      service.notify('success', config.message, config.options);
    });
    eventService.$on('cf.events.NOTIFY_WARNING', function (event, config) {
      service.notify('warning', config.message, config.options);
    });

    return service;
  }

})();
