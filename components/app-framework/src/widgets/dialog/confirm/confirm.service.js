(function () {
  'use strict';

  /**
   * @name frameworkDialogConfirm
   * @example:
   *  ```
   *  frameworkDialogConfirm({
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
    .module('app.framework.widgets')
    .factory('frameworkDialogConfirm', serviceFactory);

  function serviceFactory($uibModal, frameworkDialogEvents) {
    return frameworkDialogConfirm;

    function frameworkDialogConfirm(confirmDialogContext) {
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
        frameworkDialogEvents.notifyOpened();
        confirmDialogContext.modalInstance.closed.then(function () {
          frameworkDialogEvents.notifyClosed();
        });
      }
      // Return the modal instance so that promises can be directly attached by the caller
      return confirmDialogContext.modalInstance;
    }
  }

  /**
   * @namespace app.framework.widgets.dialog
   * @memberof app.framework.widgets
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

    var vm = this;

    vm.confirmDialogContext = confirmDialogContext;
    vm.isBusy = false;
    vm.hasError = false;
    vm.errorMessage = '';

    vm.confirmed = confirmed;
    vm.getDescription = getDescription;

    /**
     * @function confirmed
     * @memberof app.framework.widgets.dialog.ConfirmController
     * @description User confirmed so run callback
     * @returns {void}
     */
    function confirmed() {
      if (angular.isDefined(vm.confirmDialogContext.callback)) {
        vm.isBusy = true;
        vm.hasError = false;

        // Use a timeout so that the spinner will appear
        $timeout(function () {
          $q.when(vm.confirmDialogContext.callback())
            .then(function () {
              vm.confirmDialogContext.modalInstance.close();
            }, function (error) {
              var errorMessage = vm.confirmDialogContext.errorMessage || error;
              if (_.isPlainObject(error)) {
                // Try to find a description in case its an CF error object
                errorMessage = _.get(error, 'data.description') || error.description || errorMessage;
              }
              vm.errorMessage = errorMessage;
              vm.hasError = true;
            })
            .finally(function () {
              vm.isBusy = false;
            });
        }, 100);
      } else {
        vm.confirmDialogContext.modalInstance.close();
      }
    }

    function getDescription() {

      var description = vm.confirmDialogContext.description;

      if (angular.isFunction(description)) {
        description = description();
      }

      if (vm.confirmDialogContext.noHtmlEscape) {
        return description;
      } else {
        return _.escape(description);
      }
    }
  }

})();
