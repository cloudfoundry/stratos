(function () {
  'use strict';

  /**
   * @name frameworkWidgetsDialogConfirm
   * @example:
   *  ```
   *  frameworkWidgetsDialogConfirm({
   *    title: 'Are you sure?',
   *    description: 'Please confirm',
   *    noHtmlEscape: true
   *    busyDescription: 'Please wait',
   *    errorMessage: 'There was a problem with your request',
   *    buttonText: {
   *      yes: 'Yes',
   *      no: 'No'
   *    },
   *    callback: function () {}
   *  });
   *  ```
   */
  angular
    .module('helion.framework.widgets')
    .factory('frameworkWidgetsDialogConfirm', serviceFactory);

  serviceFactory.$inject = [
    '$uibModal',
    'frameworkUtilsDialogEvents'
  ];

  function serviceFactory($uibModal, frameworkUtilsDialogEvents) {
    return frameworkWidgetsDialogConfirm;

    function frameworkWidgetsDialogConfirm(confirmDialogContext) {
      confirmDialogContext = confirmDialogContext || {};
      confirmDialogContext.modalInstance = $uibModal.open({
        controller: ConfirmController,
        controllerAs: 'confirmCtrl',
        templateUrl: 'framework/widgets/dialog/confirm/confirm.html',
        resolve: {
          confirmDialogContext: function () {
            return confirmDialogContext;
          }
        },
        windowClass: 'confirm-dialog' + (confirmDialogContext.windowClass ? ' ' + confirmDialogContext.windowClass : '')
      });
      if (confirmDialogContext.modalInstance && confirmDialogContext.modalInstance.closed) {
        frameworkUtilsDialogEvents.notifyOpened();
        confirmDialogContext.modalInstance.closed.then(function () {
          frameworkUtilsDialogEvents.notifyClosed();
        });
      }
      // Return the modal instance so that promises can be directly attached by the caller
      return confirmDialogContext.modalInstance;
    }
  }

  ConfirmController.$inject = [
    '$q',
    '$timeout',
    'confirmDialogContext'
  ];

  /**
   * @namespace helion.framework.widgets.dialog
   * @memberof helion.framework.widgets
   * @name ConfirmController
   * @constructor
   * @param {object} $q - the Angular $q service
   * @param {object} $timeout - the Angular $timeout service
   * @param {object} confirmDialogContext - the confirm dialog context
   * @property {object} $q - the Angular $q service
   * @property {object} $timeout - the Angular $timeout service
   * @property {object} confirmDialogContext - the confirm dialog context
   * @property {boolean} isBusy - request is being processed, show spinner
   * @property {boolean} hasError - request returned an error
   */
  function ConfirmController($q, $timeout, confirmDialogContext) {
    this.$q = $q;
    this.$timeout = $timeout;
    this.confirmDialogContext = confirmDialogContext;
    this.isBusy = false;
    this.hasError = false;
    this.errorMessage = '';
  }

  angular.extend(ConfirmController.prototype, {
    /**
     * @function confirmed
     * @memberof helion.framework.widgets.dialog.ConfirmController
     * @description User confirmed so run callback
     * @returns {void}
     */
    confirmed: function () {
      var that = this;
      if (angular.isDefined(this.confirmDialogContext.callback)) {
        this.isBusy = true;
        this.hasError = false;

        // Use a timeout so that the spinner will appear
        this.$timeout(function () {
          that.$q.when(that.confirmDialogContext.callback())
            .then(function () {
              that.confirmDialogContext.modalInstance.close();
            }, function (error) {
              var errorMessage = that.confirmDialogContext.errorMessage || error;
              if (_.isPlainObject(error)) {
                // Try to find a description in case its an HCF error object
                errorMessage = _.get(error, 'data.description') || error.description || errorMessage;
              }
              that.errorMessage = errorMessage;
              that.hasError = true;
            })
            .finally(function () {
              that.isBusy = false;
            });
        }, 100);
      } else {
        this.confirmDialogContext.modalInstance.close();
      }
    },

    getDescription: function () {

      var description = this.confirmDialogContext.description;

      if (angular.isFunction(description)) {
        description = description();
      }

      if (this.confirmDialogContext.noHtmlEscape) {
        return description;
      } else {
        return _.escape(description);
      }
    }
  });

})();
