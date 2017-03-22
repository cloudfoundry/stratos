(function () {
  'use strict';

  /**
   * @name helion.framework.widgets.asyncTaskDialog
   * @example:
   *  ```
   *  asyncTaskDialog({
   *    title: 'Async Task Dialog Title',
   *    templateUrl: 'html/template/path.html'
   *    },
   *    {
   *      data: {}
   *    }
   *  }, actionPromise);
   */
  angular
    .module('helion.framework.widgets')
    .factory('helion.framework.widgets.asyncTaskDialog', serviceFactory)
    .controller('AsyncTaskDialogController', AsyncTaskDialogController);

  serviceFactory.$inject = [
    'helion.framework.widgets.detailView',
    '$timeout'
  ];

  /**
   *
   * @name serviceFactory
   * @description Factory for async task dialogs
   * @memberof helion.framework.widgets.asyncTaskDialog
   * @param {helion.framework.widgets.detailView} detailView detailView
   * @param {function} $timeout - angular $timeout servie
   * @returns {helion.framework.widgets.asyncTaskDialog}  asyncTaskDialog dialog instance
   */
  function serviceFactory(detailView, $timeout) {

    /**
     * @name asyncDialog
     * @description Constructor for asyncDialog
     * @memberof helion.framework.widgets.asyncTaskDialog
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
      config.detailViewTemplateUrl = 'widgets/async-task-dialog/async-task-dialog.html';

      context.buttonTitles = {
        submit: gettext(config.buttonTitles && config.buttonTitles.submit) || gettext('Done'),
        cancel: gettext(config.buttonTitles && config.buttonTitles.cancel) || gettext('Cancel')
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
      var uibModal = detailView(
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
          context.asyncTaskDialog.setSpinner(true);
        });

        uibModal.rendered.then(function () {
          context.asyncTaskDialog.disableAllInput();
          var promise = angular.isFunction(initPromise) ? initPromise() : initPromise;
          promise.finally(function () {
            context.asyncTaskDialog.setSpinner(false);
            context.asyncTaskDialog.enableAllInput();
          });
        });
      }

      return uibModal;
    }

    return asyncDialog;
  }

  AsyncTaskDialogController.$inject = [
    '$scope',
    'context',
    'content',
    '$uibModalInstance'
  ];

  /**
   * @name AsyncTaskDialogController
   * @description Async task Dialog controller
   * @namespace helion.framework.widgets.asyncTaskDialog
   * @param {Object} $scope Angular scope
   * @param {Object} context context of dialog
   * @param {Object} content content of dialog
   * @param {Object} $uibModalInstance - Bootstrap UIB Modal Instance service
   * @constructor
   */
  function AsyncTaskDialogController($scope, context, content, $uibModalInstance) {
    this.context = context;
    this.content = content;
    this.showSpinner = false;
    this.$uibModalInstance = $uibModalInstance;
    this.$scope = $scope;
    // Set form name attribute to form.myForm
    this.$scope.form = {};

    this.context.asyncTaskDialog = {
      disableAllInput: _.bind(this._disableAllInput, this),
      enableAllInput: _.bind(this._enableAllInput, this),
      setSpinner: _.bind(this._setSpinner, this)
    };

  }

  angular.extend(AsyncTaskDialogController.prototype, {

    /**
     * @name invokeAction
     * @description invokes the asyn task
     * @namespace helion.framework.widgets.asyncTaskDialog
     * @returns {Promise}
     */
    invokeAction: function () {
      this.showSpinner = true;
      this._disableAllInput();
      this.response = null;
      this.context.showErrorBar = false;
      var that = this;
      return this.context.submitAction(this.context.data, this)
        .then(function (responseData) {
          that.response = responseData;
        }).catch(function () {
          that.context.showErrorBar = that.context.errorMsg ? that.context.errorMsg : true;
        }).finally(function () {
          that.showSpinner = false;
          that._enableAllInput();
          if (!that.context.showErrorBar) {
            // Successfully completed action
            // resolve success promise with data returned by submitAction.
            that.$uibModalInstance.close(that.response);
          }
        });
    },

    /**
     * @name disableSubmit
     * @description should the submit button be disabled
     * @namespace helion.framework.widgets.disableSubmit
     * @returns {boolean}
     */
    disableSubmit: function () {
      return this.disableButtons || this.showSpinner || this.isFormInvalid();
    },

    _setSpinner: function (showSpinner) {
      this.showSpinner = showSpinner;
    },

    /**
     * @name _disableAllInput
     * @description disables all input and button fields in the dialog
     * when an action async task is executing
     * @namespace helion.framework.widgets.asyncTaskDialog
     * @private
     */
    _disableAllInput: function () {
      var fieldset = angular.element('.async-dialog').find('fieldset');
      if (fieldset.length) {
        fieldset.attr('disabled', 'disabled');
      } else {
        angular.element('.async-dialog').find('input, textarea, button, select').attr('disabled', 'disabled');
      }
      this.disableButtons = true;
    },

    /**
     * @name _enableAllInput
     * @description enables all input and button fields in the dialog
     * @namespace helion.framework.widgets.asyncTaskDialog
     * @private
     */
    _enableAllInput: function () {
      var fieldset = angular.element('.async-dialog').find('fieldset');
      if (fieldset.length) {
        fieldset.attr('disabled', false);
      } else {
        angular.element('.async-dialog').find('input, textarea, button, select').attr('disabled', false);
      }
      this.disableButtons = false;
    },

    /**
     * @name disableMargin
     * @description Helper function used to disable top
     * margin for footer when an action is being carried out
     * @namespace helion.framework.widgets.asyncTaskDialog
     * @returns {boolean}
     */
    disableMargin: function () {
      return this.showSpinner && this.context.showErrorBar;
    },

    /**
     * @name hasErrorMessage
     * @description Helper function to determine if there is a custom error message
     * @namespace helion.framework.widgets.asyncTaskDialog
     * @returns {boolean}
     */
    hasErrorMessage: function () {
      return angular.isString(this.context.showErrorBar);
    },

    /**
     * @name isFormInvalid
     * @description Helper function to determine is form (if present) is invalid
     * @namespace helion.framework.widgets.asyncTaskDialog
     * @returns {boolean}
     */
    isFormInvalid: function () {

      var isInvalid = false;
      if (this.context.invalidityCheck) {
        // custom check has been provided
        isInvalid = this.context.invalidityCheck(this.context.data);
      } else if (!_.isEmpty(this.$scope.form)) {
        // A form exists in the dialog
        // If multiple forms are present,
        // nest them in an ng-form element
        var form = _.values(this.$scope.form)[0];
        isInvalid = form.$invalid;
      }
      return isInvalid;
    }
  })
  ;

})();
