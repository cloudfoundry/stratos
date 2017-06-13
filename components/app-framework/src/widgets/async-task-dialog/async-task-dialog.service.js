(function () {
  'use strict';

  /**
   * @name app.framework.widgets.frameworkAsyncTaskDialog
   * @example:
   *  ```
   *  frameworkAsyncTaskDialog({
   *    title: 'Async Task Dialog Title',
   *    templateUrl: 'html/template/path.html'
   *    },
   *    {
   *      data: {}
   *    }
   *  }, actionPromise);
   */
  angular
    .module('app.framework.widgets')
    .factory('frameworkAsyncTaskDialog', serviceFactory)
    .controller('AsyncTaskDialogController', AsyncTaskDialogController);

  /**
   *
   * @name serviceFactory
   * @description Factory for async task dialogs
   * @memberof frameworkAsyncTaskDialog
   * @param {app.framework.widgets.frameworkDetailView} frameworkDetailView frameworkDetailView
   * @param {function} $timeout - angular $timeout servie
   * @returns {frameworkAsyncTaskDialog}  frameworkAsyncTaskDialog dialog instance
   */
  function serviceFactory(frameworkDetailView, $timeout) {

    /**
     * @name asyncDialog
     * @description Constructor for asyncDialog
     * @memberof frameworkAsyncTaskDialog
     * @param {Object} config config properties
     * @param {Object} context Context of dialog
     * @param {function} submitAction Async task to carry out
     * @param {function} invalidityCheck custom check for determining validity of template
     * @param {promise} initPromise promise to be resolved before the dialog is ready to be interacted with
     * @returns {*}
     */
    function asyncDialog(config, context, submitAction, invalidityCheck, initPromise) {

      config.controller = AsyncTaskDialogController;
      config.controllerAs = 'asyncTaskDialogCtrl';
      config.detailViewTemplateUrl = 'framework/widgets/async-task-dialog/async-task-dialog.html';

      context.buttonTitles = {
        submit: config.buttonTitles && config.buttonTitles.submit || 'buttons.done',
        cancel: config.buttonTitles && config.buttonTitles.cancel || 'buttons.cancel'
      };

      if (_.isFunction(config.submitCommit)) {
        context.submitCommit = config.submitCommit;
      } else {
        context.submitCommit = function () {
          return !!config.submitCommit;
        };
      }
      context.noCancel = !!config.noCancel;
      context.noSubmit = !!config.noSubmit;

      if (angular.isFunction(invalidityCheck)) {
        context.invalidityCheck = invalidityCheck;
      }

      context.showErrorBar = false;

      context.submitAction = submitAction;
      var uibModal = frameworkDetailView(
        config,
        context
      );
      uibModal.rendered.then(function () {
        $timeout(function () {
          var forms = angular.element('.async-dialog').find('form');
          if (forms.length > 0) {
            angular.element(forms[0]).on('change', function () {
              context.showErrorBar = false;
            });
          }
        });
      });

      if (angular.isDefined(initPromise)) {
        uibModal.opened.then(function () {
          context.frameworkAsyncTaskDialog.setSpinner(true);
        });

        uibModal.rendered.then(function () {
          context.frameworkAsyncTaskDialog.disableAllInput();
          var promise = angular.isFunction(initPromise) ? initPromise() : initPromise;
          promise.finally(function () {
            context.frameworkAsyncTaskDialog.setSpinner(false);
            context.frameworkAsyncTaskDialog.enableAllInput();
          });
        });
      }

      return uibModal;
    }

    return asyncDialog;
  }

  /**
   * @name AsyncTaskDialogController
   * @description Async task Dialog controller
   * @namespace frameworkAsyncTaskDialog
   * @param {Object} $scope Angular scope
   * @param {Object} context context of dialog
   * @param {Object} content content of dialog
   * @param {Object} $uibModalInstance - Bootstrap UIB Modal Instance service
   * @constructor
   */
  function AsyncTaskDialogController($scope, context, content, $uibModalInstance) {

    var vm = this;

    vm.context = context;
    vm.content = content;
    vm.showSpinner = false;

    // In the dialog template set the form name attribute to form.<form name> to ensure validation is passed to
    // submit button. This process needs to be fixed
    /* eslint-disable angular/controller-as */
    $scope.form = {};
    /* eslint-enable angular/controller-as */

    vm.context.frameworkAsyncTaskDialog = {
      disableAllInput: _disableAllInput,
      enableAllInput: _enableAllInput,
      setSpinner: _setSpinner
    };

    vm.invokeAction = invokeAction;
    vm.disableSubmit = disableSubmit;
    vm.disableMargin = disableMargin;
    vm.hasErrorMessage = hasErrorMessage;
    vm.isFormInvalid = isFormInvalid;

    /**
     * @name invokeAction
     * @description invokes the asyn task
     * @namespace frameworkAsyncTaskDialog
     * @returns {object}
     */
    function invokeAction() {
      vm.showSpinner = true;
      _disableAllInput();
      vm.response = null;
      vm.context.showErrorBar = false;
      return vm.context.submitAction(vm.context.data, vm)
        .then(function (responseData) {
          vm.response = responseData;
        }).catch(function () {
          vm.context.showErrorBar = vm.context.errorMsg ? vm.context.errorMsg : true;
        }).finally(function () {
          vm.showSpinner = false;
          _enableAllInput();
          if (!vm.context.showErrorBar) {
            // Successfully completed action
            // resolve success promise with data returned by submitAction.
            $uibModalInstance.close(vm.response);
          }
        });
    }

    /**
     * @name disableSubmit
     * @description should the submit button be disabled
     * @namespace app.framework.widgets.disableSubmit
     * @returns {boolean}
     */
    function disableSubmit() {
      return vm.disableButtons || vm.showSpinner || vm.isFormInvalid();
    }

    function _setSpinner(showSpinner) {
      vm.showSpinner = showSpinner;
    }

    /**
     * @name _disableAllInput
     * @description disables all input and button fields in the dialog
     * when an action async task is executing
     * @namespace frameworkAsyncTaskDialog
     * @private
     */
    function _disableAllInput() {
      var fieldset = angular.element('.async-dialog').find('fieldset');
      if (fieldset.length) {
        fieldset.attr('disabled', 'disabled');
      } else {
        angular.element('.async-dialog').find('input, textarea, button, select').attr('disabled', 'disabled');
      }
      vm.disableButtons = true;
    }

    /**
     * @name _enableAllInput
     * @description enables all input and button fields in the dialog
     * @namespace frameworkAsyncTaskDialog
     * @private
     */
    function _enableAllInput() {
      var fieldset = angular.element('.async-dialog').find('fieldset');
      if (fieldset.length) {
        fieldset.attr('disabled', false);
      } else {
        angular.element('.async-dialog').find('input, textarea, button, select').attr('disabled', false);
      }
      vm.disableButtons = false;
    }

    /**
     * @name disableMargin
     * @description Helper function used to disable top
     * margin for footer when an action is being carried out
     * @namespace frameworkAsyncTaskDialog
     * @returns {boolean}
     */
    function disableMargin() {
      return vm.showSpinner && vm.context.showErrorBar;
    }

    /**
     * @name hasErrorMessage
     * @description Helper function to determine if there is a custom error message
     * @namespace frameworkAsyncTaskDialog
     * @returns {boolean}
     */
    function hasErrorMessage() {
      return angular.isString(vm.context.showErrorBar);
    }

    /**
     * @name isFormInvalid
     * @description Helper function to determine is form (if present) is invalid
     * @namespace frameworkAsyncTaskDialog
     * @returns {boolean}
     */
    function isFormInvalid() {

      var isInvalid = false;
      if (vm.context.invalidityCheck) {
        // custom check has been provided
        isInvalid = vm.context.invalidityCheck(vm.context.data);
      } else if (!_.isEmpty($scope.form)) {
        // A form exists in the dialog
        // If multiple forms are present,
        // nest them in an ng-form element
        var form = _.values($scope.form)[0];
        isInvalid = form.$invalid;
      }
      return isInvalid;
    }
  }

})();
