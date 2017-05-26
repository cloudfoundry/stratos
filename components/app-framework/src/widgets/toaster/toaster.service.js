(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .factory('frameworkToaster', toasterServiceFactory);

  // See: https://github.com/Foxandxss/angular-toastr for the underlying library that is used

  /**
   * @namespace app.framework.widgets.frameworkToaster
   * @memberof app.framework.widgets
   * @name frameworkToaster
   * @description A service for sjhow toast-style notifications
   * @param {object} $q - the Angular promise service
   * @param {object} $timeout - the Angular $timeout service
   * @param {object} toastrConfig - the toasterConfig object for the toastr library
   * @param {object} toastr - the toastr library
   * @example
   *  ```
   *  frameworkToaster.error('Example error toast notification');
   * @returns {object} The toaster notification service
   */
  function toasterServiceFactory($q, $timeout, toastrConfig, toastr) {
    // Set our defaults for the toastr library
    angular.extend(toastrConfig, {
      autoDismiss: false,
      allowHtml: true,
      closeButton: true,
      closeHtml: '<button class="toast-close-btn close"></button>',
      iconClasses: {
        error: 'toast-error',
        info: 'toast-info',
        success: 'toast-success',
        warning: 'toast-warning'
      },
      templates: {
        toast: 'framework/widgets/toaster/toast.html',
        progressbar: 'framework/widgets/toaster/progressbar.html'
      },
      messageClass: 'toast-message',
      progressBar: false,
      tapToDismiss: false,
      timeOut: 5000,
      titleClass: 'toast-title',
      toastClass: 'toast',
      maxOpened: 3,
      positionClass: 'toast-top-center'
    });

    return {

      /**
       * @function success
       * @description Show a success notification
       * @param {string} message - message to show in the notification
       * @param {object} options - optional override options for toastr
       * @returns {object} Toast object for the shown notification
       */
      success: function (message, options) {
        return this.show(message, 'toast-success', options);
      },

      /**
       * @function warning
       * @description Show a warning notification
       * @param {string} message - message to show in the notification
       * @param {object} options - optional override options for toastr
       * @returns {object} Toast object for the shown notification
       */
      warning: function (message, options) {
        return this.show(message, 'toast-warning', options);
      },

      /**
       * @function error
       * @description Show a error notification
       * @param {string} message - message to show in the notification
       * @param {object} options - optional override options for toastr
       * @returns {object} Toast object for the shown notification
       */
      error: function (message, options) {
        return this.show(message, 'toast-error', options);
      },

      /**
       * @function show
       * @description Show a notification with a custom icon
       * @param {string} message - message to show in the notification
       * @param {string} iconClass - icon class to show in the notification
       * @param {object} options - optional override options for toastr
       * @returns {object} Toast object for the shown notification
       */
      show: function (message, iconClass, options) {
        var opts = {
          iconClass: 'toast-helion',
          titleClass: iconClass
        };
        _.assign(opts, options);
        return toastr.success(message, '', opts);
      },

      /**
       * @function busy
       * @description Show a busy notification
       * @param {string} message - message to show in the notification
       * @param {object} options - optional override options for toastr
       * @returns {object} Toast object for the shown notification (with close method)
       */
      busy: function (message, options) {
        var opts = {
          iconClass: 'toast-helion toast-busy',
          titleClass: '',
          extraData: {busy: true},
          closeButton: false,
          autoDismiss: false,
          timeOut: 0
        };
        _.assign(opts, options);
        var toast = toastr.success(message, '', opts);

        /**
         * @function close
         * @description Close the busy notification
         * @returns {object} Promise that resolves once the notification has been removed
         */
        toast.close = function () {
          var deferred = $q.defer();
          toast.scope.close(false);
          $timeout(function () {
            deferred.resolve(true);
          }, 250);
          return deferred.promise;
        };

        return toast;
      },

      /**
       * @function clear
       * @description Clear the toast notification provided. Alternatively if no toast is passed in clear all toasts.
       * @param {string} toast - toast object returned via success, warn, error, show or busy
       */
      clear: function (toast) {
        toastr.clear(toast);
      }
    };
  }
})();
