(function () {
  'use strict';

  angular
    .module('helionFrameworkExamples')
    .directive('myWorkflow', myWorkflow);

  myWorkflow.$inject = [
    'helionFrameworkExamples.basePath'
  ];

  function myWorkflow(path) {
    return {
      controller: MyWorkflowController,
      controllerAs: 'myWorkflowCtrl',
      templateUrl: path + 'wizard/my-workflow.html'
    };
  }

  MyWorkflowController.$inject = [
    'helionFrameworkExamples.basePath',
    '$q',
    '$timeout'
  ];

  function MyWorkflowController(path, $q, $timeout) {
    var that = this;

    this.userInput = {
      username: '',
      agree: false
    };

    this.workflow = {
      allowJump: false,
      allowBack: false,
      title: 'My Wizard',
      btnText: {
        cancel: 'Close'
      },
      hideStepNavStack: !true,
      steps: [
        {
          title: 'Step 1',
          formName: 'form1',
          templateUrl: path + 'wizard/step-1.html',
          nextBtnText: 'Go Next',
          cancelBtnText: 'Cancel',
          showBusyOnEnter: 'Preparing for initial step',
          onEnter: function () {
            var d = $q.defer();
            $timeout(function () {
              d.resolve();
            }, 5000);
            return d.promise;
          },
          showBusyOnNext: true,
          onNext: function () {
            var d = $q.defer();
            $timeout(function () {
              if (that.userInput.username === 'myname') {
                d.reject('Error: this name has been taken');
              } else {
                d.resolve();
              }
            }, 2000);
            return d.promise;
          }
        },
        {
          title: 'Step 2',
          formName: 'form2',
          templateUrl: path + 'wizard/step-2.html'
        },
        {
          title: 'Step 3',
          formName: 'form3',
          templateUrl: path + 'wizard/step-3.html',
          nextBtnText: 'Skip',
          showBusyOnEnter: 'Preparing for step 3',
          onEnter: function () {
            var d = $q.defer();
            $timeout(function () {
              d.resolve();
            }, 1500);
            return d.promise;
          }
        },
        {
          title: 'Step 4',
          formName: 'form4',
          templateUrl: path + 'wizard/step-4.html',
          checkReadiness: function () {
            var d = $q.defer();
            $timeout(function () {
              d.reject();
            }, 500);
            return d.promise;
          }
        },
        {
          title: 'Step 5',
          formName: 'form5',
          templateUrl: path + 'wizard/step-5.html',
          checkReadiness: false,
          nextBtnText: 'Next',
          onNext: function () {
            var d = $q.defer();
            $timeout(function () {
              that.appendSubflow(that.subflows[that.options.subflow]);
              d.resolve();
            }, 0);
            return d.promise;
          }
        }
      ]
    };

    this.subflows = {
      one: [
        {
          ready: true,
          title: 'Step 1 in subflow one',
          formName: 'form_1_subflow_one',
          templateUrl: path + 'wizard/subflow-one-step-1.html',
          showBusyOnNext: true,
          onNextCancellable: true,
          onNext: function () {
            var d = $q.defer();
            $timeout(function () {
              d.resolve();
            }, 10000);
            return d.promise;
          }
        },
        {
          ready: true,
          title: 'Step 2 in subflow one',
          formName: 'form_2_subflow_one',
          templateUrl: path + 'wizard/subflow-one-step-2.html',
          nextBtnText: 'Done',
          isLastStep: true
        }
      ],
      two: [
        {
          ready: true,
          title: 'Step 1 in subflow two',
          formName: 'form_1_subflow_two',
          templateUrl: path + 'wizard/subflow-two-step-1.html'
        },
        {
          ready: true,
          title: 'Step 2 in subflow two',
          formName: 'form_2_subflow_two',
          templateUrl: path + 'wizard/subflow-two-step-2.html',
          nextBtnText: 'Complete',
          isLastStep: true
        }
      ]
    };

    /* eslint-disable no-alert */
    this.actions = {
      stop: function () {
        alert('stop.');
      },
      finish: function () {
        alert('Finish.');
      }
    };
    /* eslint-enable no-alert */

    this.options = {
      workflow: that.workflow,
      userInput: that.userInput
    };
  }

  angular.extend(MyWorkflowController.prototype, {

    appendSubflow: function (subflow) {
      [].push.apply(this.workflow.steps, subflow);
    }
  });

})();
