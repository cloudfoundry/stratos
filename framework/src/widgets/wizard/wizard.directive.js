(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('wizard', wizard);

  wizard.$inject = [
    'helion.framework.basePath'
  ];

  /**
   * @namespace helion.framework.widgets.wizard
   * @memberof helion.framework.widgets
   * @name wizard
   * @description A wizard directive
   * @param {string} path - the framework base path
   * @returns {object} The wizard directive definition object
   */
  function wizard(path) {
    return {
      bindToController: {
        actions: '=',
        options: '='
      },
      controller: WizardController,
      controllerAs: 'wizardCtrl',
      templateUrl: path + 'widgets/wizard/wizard.html',
      scope: {}
    };
  }

  WizardController.$inject = [
    '$scope',
    '$q'
  ];

  /**
   * @namespace helion.framework.widgets.wizard.WizardController
   * @memberof helion.framework.widgets
   * @name WizardController
   * @constructor
   * @param {object} $scope - the $scope
   * @param {object} $q - the $q service
   * @property {object} $scope - the $scope
   * @property {object} $q - the $q service
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
    var that = this;

    this.$scope = $scope;
    this.$q = $q;

    this.wizardEvents = {
      ON_INIT_SUCCESS: 'ON_INIT_SUCCESS',
      ON_INIT_ERROR: 'ON_INIT_ERROR',
      ON_SWITCH: 'ON_SWITCH',
      BEFORE_SUBMIT: 'BEFORE_SUBMIT',
      AFTER_SUBMIT: 'AFTER_SUBMIT'
    };
    this.nextBtnDisabled = true;
    this.backBtnDisabled = true;
    this.cancelBtnDisabled = true;

    this.initTask = this.$q.defer();
    this.initPromise = this.initTask.promise;

    this.postInitTask = this.$q.defer();

    this.showNextCancel = false;
    this.cancelNextTask = null;

    this.currentIndex = -1;
    this.workflow = this.options.workflow || {};
    this.message = '';
    this.messageClass = null;
    this.hasMessage = false;
    this.busyMessage = false;

    if (this.workflow.initControllers) {
      this.workflow.initControllers(this);
    }

    this.btnText = this.workflow.btnText;
    this.steps = this.workflow.steps || [];

    // allowJump can be a value or function
    if (!_.isFunction(this.workflow.allowJump)) {
      var allowJump = this.workflow.allowJump;
      this.workflow.allowJump = function () {
        return allowJump;
      };
    }

    this.initPromise.then(function () {
      that.onInitSuccess();
      that.postInitTask.resolve();
    }, function () {
      that.onInitError();
      that.postInitTask.reject();
    });

    this.checkAllReadiness().then(function () {
      that.always();
    }, function () {
      that.always();
    });

    this.$scope.$watch(function () {
      return that.steps.length;
    }, function () {
      that.resetButtons();
    });
  }

  angular.extend(WizardController.prototype, {
    /**
     * @function disableButtons
     * @memberof helion.framework.widgets.wizard.WizardController
     * @description disable buttons in button bar
     * @returns {void}
     */
    disableButtons: function () {
      this.nextBtnDisabled = true;
      this.backBtnDisabled = true;
      this.cancelBtnDisabled = true;
    },

    /**
     * @function resetButtons
     * @memberof helion.framework.widgets.wizard.WizardController
     * @description reset buttons in button bar
     * @returns {void}
     */
    resetButtons: function () {
      if (!this.busyMessage) {
        this.backBtnDisabled = !this.steps[this.currentIndex - 1];
        this.nextBtnDisabled = false;
        this.cancelBtnDisabled = false;
      }
    },

    /**
     * @function disableNext
     * @memberof helion.framework.widgets.wizard.disableNext
     * @description Takes into account local nextBtnDisabled AND the validation state of the form
     * @returns {boolean}
     */
    disableNext: function () {
      var step = this.steps[this.currentIndex] || {};
      var form = this.$scope.wizardForm[step.formName];
      return this.nextBtnDisabled || form && form.$invalid;
    },

    /**
     * @function switchTo
     * @memberof helion.framework.widgets.wizard.WizardController
     * @description switch to a step by the given index if the step exists
     * @param {number} index - the index of the step to switch to
     * @returns {*}
     */
    switchTo: function (index) {
      if (!this.steps[index]) {
        return null;
      }

      var that = this;
      this.busyMessage = false;
      this.disableButtons();

      // Allow a step to support an onEnter property which can return a promise (use resolved promise if not)
      var step = this.steps[index];
      var readyToGo = step.onEnter ? step.onEnter(this) : this.$q.when(true);

      // Show a busy indicator if desired
      if (step.onEnter && step.showBusyOnEnter) {
        this.busyMessage = step.showBusyOnEnter;
        this.currentIndex = -1;
      }

      // Use finally for now so that we reset the buttons regardless of whether there is an error
      return readyToGo.then(function () {
        that.$scope.$broadcast(that.wizardEvents.ON_SWITCH, {
          from: that.currentIndex,
          to: index
        });
        that.currentIndex = index;
        that.busyMessage = false;
        that.resetButtons();
      });
    },

    /**
     * @function next
     * @memberof helion.framework.widgets.wizard.WizardController
     * @description switch to next step if there is one
     * @returns {void}
     */
    next: function () {
      var that = this;
      var step = this.steps[this.currentIndex];

      this.busyMessage = false;
      this.showNextCancel = false;
      this.disableButtons();
      // NOTE - We could use a resolved promise when there is no onNext to simplify the flow below
      var onNext = this.steps[this.currentIndex].onNext;
      var index = this.currentIndex;
      if (onNext) {
        var currentStep = this.steps[index];
        // Show a busy indicator if desired
        if (currentStep.showBusyOnNext) {
          this.busyMessage = step.showBusyOnNext;
          this.currentIndex = -2;
        }

        var p = onNext();
        if (p) {
          this.$q(function (resolve, reject) {
            p.then(resolve, reject);

            if (currentStep.onNextCancellable) {
              that.showNextCancel = true;
              that.cancelNextTask = function cancelTask() {
                if (currentStep.onNextCancel) {
                  currentStep.onNextCancel();
                }
                reject();
              };
            }
          })
          .then(function () {
            if (step.isLastStep) {
              that.resetMessage();
              that.actions.finish(that);
            } else {
              that.switchTo(index + 1).finally(function () {
                that.resetMessage();
              });
            }
          }, function (message) {
            // Hide the loading indicator if we showed one
            that.currentIndex = index;
            that.busyMessage = false;
            if (message) {
              that.showMessage(message, 'alert-danger');
            } else {
              that.resetMessage();
            }
            that.resetButtons();
          });
        } else {
          if (step.isLastStep) {
            this.actions.finish(this);
          } else {
            this.switchTo(index + 1);
          }
        }
      } else {
        if (step.isLastStep) {
          this.actions.finish(this);
        } else {
          this.switchTo(index + 1);
        }
      }
    },

    /**
     * @function back
     * @memberof helion.framework.widgets.wizard.WizardController
     * @description switch back to previous step if there is one
     * @returns {void}
     */
    back: function () {
      this.switchTo(this.currentIndex - 1);
    },

    /**
     * @function stop
     * @memberof helion.framework.widgets.wizard.WizardController
     * @description stop workflow
     * @returns {void}
     */
    cancel: function () {
      this.actions.stop();
    },

    /**
     * @function showMessage
     * @memberof helion.framework.widgets.wizard.WizardController
     * @description show error message
     * @param {string} message - the message text
     * @param {string} messageClass - a CSS class name for the message
     * @returns {void}
     */
    showMessage: function (message, messageClass) {
      this.showNextCancel = false;
      this.showSpinner = false;
      this.message = message;
      this.messageClass = messageClass;
      this.hasMessage = true;
    },

    /**
     * @function resetMessage
     * @memberof helion.framework.widgets.wizard.WizardController
     * @description reset message
     * @returns {void}
     */
    resetMessage: function () {
      this.showNextCancel = false;
      this.showSpinner = false;
      this.message = '';
      this.messageClass = '';
      this.hasMessage = false;
    },

    /**
     * @function onInitSuccess
     * @memberof helion.framework.widgets.wizard.WizardController
     * @description initialization success handler
     * @returns {void}
     */
    onInitSuccess: function () {
      this.resetButtons();
      this.$scope.$broadcast(this.wizardEvents.ON_INIT_SUCCESS);
    },

    /**
     * @function onInitError
     * @memberof helion.framework.widgets.wizard.WizardController
     * @description initialization error handler
     * @returns {void}
     */
    onInitError: function () {
      this.$scope.$broadcast(this.wizardEvents.ON_INIT_ERROR);
    },

    /**
     * @function checkAllReadiness
     * @memberof helion.framework.widgets.wizard.WizardController
     * @description check if each step is ready
     * @returns {void}
     */
    checkAllReadiness: function () {
      var stepReadyPromises = [];
      var that = this;

      angular.forEach(this.steps, function (step, index) {
        step.ready = !step.checkReadiness;

        if (step.checkReadiness) {
          var promise = step.checkReadiness();
          stepReadyPromises.push(promise);
          promise.then(function () {
            step.ready = true;
          }, function () {
            that.steps.splice(index, 1);
          });
        }
      });

      this.ready = stepReadyPromises.length === 0;
      return this.$q.all(stepReadyPromises);
    },

    /**
     * @function switchToFirstReadyStep
     * @memberof helion.framework.widgets.wizard.WizardController
     * @description switch to the first ready step
     * @returns {void}
     */
    switchToFirstReadyStep: function () {
      var stepIndex = -1;
      angular.forEach(this.steps, function (step, index) {
        if (stepIndex < 0 && step.ready) {
          stepIndex = index;
        }
      }, this);

      if (stepIndex !== -1) {
        this.switchTo(stepIndex);
      }
    },

    /**
     * @function always
     * @memberof helion.framework.widgets.wizard.WizardController
     * @description the always handler for initialization
     * @returns {void}
     */
    always: function () {
      this.initTask.resolve();
      this.ready = true;
      this.switchToFirstReadyStep();
    }
  });

})();
