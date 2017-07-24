(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('wizard', wizard);

  /**
   * @namespace app.framework.widgets.wizard
   * @memberof app.framework.widgets
   * @name wizard
   * @description A wizard directive
   * @returns {object} The wizard directive definition object
   */
  function wizard() {
    return {
      bindToController: {
        actions: '=',
        options: '='
      },
      controller: WizardController,
      controllerAs: 'wizardCtrl',
      templateUrl: 'framework/widgets/wizard/wizard.html',
      scope: {}
    };
  }

  /**
   * @namespace app.framework.widgets.wizard.WizardController
   * @memberof app.framework.widgets
   * @name WizardController
   * @constructor
   * @param {object} $scope - the $scope
   * @param {object} $q - the $q service
   * @property {object} btnText - mapping of text on buttons
   * @property {object} wizardEvents - mapping of wizard internal events
   * @property {boolean} nextBtnDisabled - a flag indicating if the next button disabled
   * @property {boolean} backBtnDisabled - a flag indicating if the back button disabled
   * @property {boolean} cancelBtnDisabled - a flag indicating if the cancel button disabled
   * @property {object} initTask - a deferred task for wizard initialization
   * @property {object} initPromise - the promise of initTask
   * @property {object} postInitTask - a deferred task for post-initialization
   * @property {number} currentIndex - index of the current step in the workflow
   * @property {object} workflow - the workflow driving the wizard
   * @property {string} message - message text
   * @property {string} messageClass - a CSS class name for the message
   * @property {boolean} hasMessage - a flag indicating if the wizard has errors
   * @property {array} steps - an array of steps defined for the wizard
   */
  function WizardController($scope, $q) {
    var vm = this;

    vm.wizardEvents = {
      ON_INIT_SUCCESS: 'ON_INIT_SUCCESS',
      ON_INIT_ERROR: 'ON_INIT_ERROR',
      ON_SWITCH: 'ON_SWITCH',
      BEFORE_SUBMIT: 'BEFORE_SUBMIT',
      AFTER_SUBMIT: 'AFTER_SUBMIT'
    };
    vm.nextBtnDisabled = true;
    vm.backBtnDisabled = true;
    vm.cancelBtnDisabled = true;

    vm.initTask = $q.defer();
    vm.initPromise = vm.initTask.promise;

    vm.postInitTask = $q.defer();

    vm.showNextCancel = false;
    vm.cancelNextTask = null;

    vm.currentIndex = -1;
    vm.workflow = vm.options.workflow || {};
    vm.message = '';
    vm.messageClass = null;
    vm.hasMessage = false;
    vm.busyMessage = false;

    if (vm.workflow.initControllers) {
      vm.workflow.initControllers(vm);
    }

    vm.btnText = vm.workflow.btnText;
    vm.steps = vm.workflow.steps || [];

    if (vm.options.scope) {
      _.assign($scope, vm.options.scope);
    }

    // allowBack can be a value or function
    if (!_.isFunction(vm.workflow.allowBack)) {
      var allowBack = vm.workflow.allowBack;
      vm.workflow.allowBack = function () {
        return allowBack;
      };
    }

    // allowCancel can be a value or function
    if (!_.isFunction(vm.workflow.allowCancel)) {
      var cachedAllowCancel = _.isUndefined(vm.workflow.allowCancel) ? true : vm.workflow.allowCancel;
      vm.workflow.allowCancel = function () {
        return cachedAllowCancel;
      };
    }

    // allowJump can be a value or function
    if (!_.isFunction(vm.workflow.allowJump)) {
      var allowJump = vm.workflow.allowJump;
      vm.workflow.allowJump = function () {
        return allowJump;
      };
    }

    // // because allow jump only works to enable jump in all cases also have a disable in all cases option
    if (!_.isFunction(vm.workflow.disableJump)) {
      var disableJump = vm.workflow.disableJump;
      vm.workflow.disableJump = function () {
        return disableJump;
      };
    }

    vm.isNavEntryDisabled = function ($index) {
      if (vm.workflow.disableJump() || vm.workflow.allowJump()) {
        return true;
      }
      if (vm.workflow.allowBack() && $index < vm.currentIndex) {
        return false;
      }
      return vm.currentIndex !== $index;
    };

    vm.disableButtons = disableButtons;
    vm.resetButtons = resetButtons;
    vm.disableNext = disableNext;
    vm.switchTo = switchTo;
    vm.next = next;
    vm.back = back;
    vm.cancel = cancel;
    vm.showMessage = showMessage;
    vm.resetMessage = resetMessage;
    vm.onInitSuccess = onInitSuccess;
    vm.onInitError = onInitError;
    vm.checkAllReadiness = checkAllReadiness;
    vm.switchToFirstReadyStep = switchToFirstReadyStep;
    vm.always = always;
    vm.allowCancel = allowCancel;

    vm.initPromise.then(function () {
      vm.onInitSuccess();
      vm.postInitTask.resolve();
    }, function () {
      vm.onInitError();
      vm.postInitTask.reject();
    });

    vm.checkAllReadiness().then(function () {
      vm.always();
    }, function () {
      vm.always();
    });

    $scope.$watch(function () {
      return vm.steps.length;
    }, function () {
      vm.resetButtons();
    });

    /**
     * @function disableButtons
     * @memberof app.framework.widgets.wizard.WizardController
     * @description disable buttons in button bar
     * @returns {void}
     */
    function disableButtons() {
      vm.nextBtnDisabled = true;
      vm.backBtnDisabled = true;
      vm.cancelBtnDisabled = true;
    }

    /**
     * @function resetButtons
     * @memberof app.framework.widgets.wizard.WizardController
     * @description reset buttons in button bar
     * @returns {void}
     */
    function resetButtons() {
      if (!vm.busyMessage) {
        vm.backBtnDisabled = !vm.steps[vm.currentIndex - 1];
        vm.nextBtnDisabled = false;
        vm.cancelBtnDisabled = false;
      }
    }

    /**
     * @function disableNext
     * @memberof app.framework.widgets.wizard.disableNext
     * @description Takes into account local nextBtnDisabled AND the validation state of the form
     * @returns {boolean}
     */
    function disableNext() {
      var step = vm.steps[vm.currentIndex] || {};
      if (_.isFunction(step.allowNext) && !step.allowNext()) {
        return true;
      }
      if ($scope.wizardForm) {
        var form = $scope.wizardForm[step.formName];
        return vm.nextBtnDisabled || form && form.$invalid;
      }
      return vm.nextBtnDisabled;
    }

    function allowCancel() {
      if (vm.workflow.allowCancel) {
        return vm.workflow.allowCancel();
      }
      return !vm.steps[vm.currentIndex].isLastStep || vm.workflow.allowCancelAtLastStep;
    }

    /**
     * @function switchTo
     * @memberof app.framework.widgets.wizard.WizardController
     * @description switch to a step by the given index if the step exists
     * @param {number} index - the index of the step to switch to
     * @returns {*}
     */
    function switchTo(index) {
      if (!vm.steps[index]) {
        return null;
      }

      vm.busyMessage = false;
      vm.disableButtons();

      vm.btnText = vm.btnText || {};

      // Set step commit from current step or lastStepCommit
      vm.stepCommit = vm.steps[index].stepCommit || vm.workflow.lastStepCommit && index === vm.steps.length - 1;

      // Persist next button text to avoid flicker during transitions
      vm.btnText.next = vm.steps[index].nextBtnText;

      // Allow a step to support an onEnter property which can return a promise (use resolved promise if not)
      var step = vm.steps[index];
      var readyToGo = step.onEnter ? step.onEnter(vm) || $q.resolve() : $q.resolve();
      var indexFrom = vm.currentIndex;

      // Show a busy indicator if desired
      if (step.onEnter && step.showBusyOnEnter) {
        vm.busyMessage = step.showBusyOnEnter;
        vm.currentIndex = -1;
      }

      // Use finally for now so that we reset the buttons regardless of whether there is an error
      return readyToGo
        .then(function () {
          $scope.$broadcast(vm.wizardEvents.ON_SWITCH, {
            from: vm.currentIndex,
            to: index
          });
          vm.currentIndex = index;
          vm.busyMessage = false;
          vm.resetButtons();
        })
        .catch(function (message) {
          // Hide the loading indicator if we showed one
          vm.currentIndex = indexFrom;
          vm.busyMessage = false;
          if (message) {
            vm.showMessage(message, 'alert-danger');
          } else {
            vm.resetMessage();
          }
          vm.resetButtons();
          // Ensure the rejection carries up via the promise chain
          return $q.reject();
        });
    }

    /**
     * @function next
     * @memberof app.framework.widgets.wizard.WizardController
     * @description switch to next step if there is one
     * @returns {void}
     */
    function next() {
      var step = vm.steps[vm.currentIndex];
      vm.resetMessage();

      vm.busyMessage = false;
      vm.showNextCancel = false;
      vm.disableButtons();
      // NOTE - We could use a resolved promise when there is no onNext to simplify the flow below
      var onNext = vm.steps[vm.currentIndex].onNext;
      var index = vm.currentIndex;
      if (onNext) {
        var currentStep = vm.steps[index];
        // Show a busy indicator if desired
        if (currentStep.showBusyOnNext) {
          vm.busyMessage = step.showBusyOnNext;
          vm.currentIndex = -2;
        }

        var p = onNext();
        if (p) {
          $q(function (resolve, reject) {
            p.then(resolve, reject);

            if (currentStep.onNextCancellable) {
              vm.showNextCancel = true;
              vm.cancelNextTask = function cancelTask() {
                if (currentStep.onNextCancel) {
                  currentStep.onNextCancel();
                }
                reject();
              };
            }
          })
          .then(function () {
            if (step.isLastStep) {
              vm.resetMessage();
              vm.actions.finish(vm);
            } else {
              vm.switchTo(index + 1).then(function () {
                vm.resetMessage();
              });
            }
          }, function (message) {
            // Hide the loading indicator if we showed one
            vm.currentIndex = index;
            vm.busyMessage = false;
            if (message) {
              vm.showMessage(message, 'alert-danger');
            } else {
              vm.resetMessage();
            }
            vm.resetButtons();
          });
        } else {
          if (step.isLastStep) {
            vm.actions.finish(vm);
          } else {
            vm.switchTo(index + 1);
          }
        }
      } else {
        if (step.isLastStep) {
          vm.actions.finish(vm);
        } else {
          vm.switchTo(index + 1);
        }
      }
    }

    /**
     * @function back
     * @memberof app.framework.widgets.wizard.WizardController
     * @description switch back to previous step if there is one
     * @returns {void}
     */
    function back() {
      vm.switchTo(vm.currentIndex - 1);
    }

    /**
     * @function stop
     * @memberof app.framework.widgets.wizard.WizardController
     * @description stop workflow
     * @returns {void}
     */
    function cancel() {
      vm.actions.stop();
    }

    /**
     * @function showMessage
     * @memberof app.framework.widgets.wizard.WizardController
     * @description show error message
     * @param {string} message - the message text
     * @param {string} messageClass - a CSS class name for the message
     * @returns {void}
     */
    function showMessage(message, messageClass) {
      vm.showNextCancel = false;
      vm.showSpinner = false;
      vm.message = message;
      vm.messageClass = messageClass;
      vm.hasMessage = true;
    }

    /**
     * @function resetMessage
     * @memberof app.framework.widgets.wizard.WizardController
     * @description reset message
     * @returns {void}
     */
    function resetMessage() {
      vm.showNextCancel = false;
      vm.showSpinner = false;
      vm.message = '';
      vm.messageClass = '';
      vm.hasMessage = false;
    }

    /**
     * @function onInitSuccess
     * @memberof app.framework.widgets.wizard.WizardController
     * @description initialization success handler
     * @returns {void}
     */
    function onInitSuccess() {
      vm.resetButtons();
      $scope.$broadcast(vm.wizardEvents.ON_INIT_SUCCESS);
    }

    /**
     * @function onInitError
     * @memberof app.framework.widgets.wizard.WizardController
     * @description initialization error handler
     * @returns {void}
     */
    function onInitError() {
      $scope.$broadcast(vm.wizardEvents.ON_INIT_ERROR);
    }

    /**
     * @function checkAllReadiness
     * @memberof app.framework.widgets.wizard.WizardController
     * @description check if each step is ready
     * @returns {object}
     */
    function checkAllReadiness() {
      var stepReadyPromises = [];

      angular.forEach(vm.steps, function (step, index) {
        step.ready = !step.checkReadiness;

        if (step.checkReadiness) {
          var promise = step.checkReadiness();
          stepReadyPromises.push(promise);
          promise.then(function () {
            step.ready = true;
          }, function () {
            vm.steps.splice(index, 1);
          });
        }
      });

      vm.ready = stepReadyPromises.length === 0;
      return $q.all(stepReadyPromises);
    }

    /**
     * @function switchToFirstReadyStep
     * @memberof app.framework.widgets.wizard.WizardController
     * @description switch to the first ready step
     * @returns {void}
     */
    function switchToFirstReadyStep() {
      var stepIndex = -1;
      angular.forEach(vm.steps, function (step, index) {
        if (stepIndex < 0 && step.ready) {
          stepIndex = index;
        }
      }, vm);

      if (stepIndex !== -1) {
        vm.switchTo(stepIndex);
      }
    }

    /**
     * @function always
     * @memberof app.framework.widgets.wizard.WizardController
     * @description the always handler for initialization
     * @returns {void}
     */
    function always() {
      vm.initTask.resolve();
      vm.ready = true;
      vm.switchToFirstReadyStep();
    }

  }

})();
