(function () {
  'use strict';

  angular
    .module('app-setup.view', [])
    .factory('appSetupService', DeployAppService)
    .controller('app-setup.view.appSetupController', AppSetupController);

  function DeployAppService(frameworkDetailView) {

    return {
      show: show
    };

    /**
     * @memberof appSetupService
     * @name deploy
     * @returns {object} frameworkDetailView promise
     */
    function show() {
      return frameworkDetailView(
        {
          detailViewTemplateUrl: 'plugins/app-setup/view/wizard/setup-wizard.html',
          controller: AppSetupController,
          controllerAs: 'appSetup',
          dialog: true,
          class: ''
        }
      );
    }

  }

  /**
   * @memberof app-setup.view
   * @name appSetupService
   * @constructor
   * @param {object} $q - the angular $q service
   * @param {object} $uibModalInstance - the angular $uibModalInstance service used to close/dismiss a modal
   */
  function AppSetupController($uibModalInstance, $q, $timeout, appUtilsService) {

    var vm = this;

    var templatePath = 'plugins/app-setup/view/wizard/';

    var data = {
      urlValidationExpr: appUtilsService.urlValidationExpression,
      consoleScopes: []
    };

    var userInput = {

    };

    var stepUaa1 = {
      title: 'app-setup.step-1.title',
      templateUrl: templatePath + 'setup-step-1.html',
      formName: 'step1',
      data: data,
      userInput: userInput,
      stepCommit: false
    };
    var stepUaa2 = {
      title: 'app-setup.step-2.title',
      templateUrl: templatePath + 'setup-step-2.html',
      formName: 'step2',
      data: data,
      userInput: userInput,
      nextBtnText: 'buttons.done',
      showBusyOnEnter: 'app-setup.step-2.enter-message',
      onEnter: function () {
        var mockedData = ["scim.me","openid","profile","roles","stratos.publisher","uaa.user","notification_preferences.write","cloud_controller.read","password.write","approvals.me","cloud_controller.write","cloud_controller_service_permissions.read","stratos.admin","oauth.approvals","stratos.user"];
        [].push.apply(data.consoleScopes, _.map(mockedData, function selectOptionMapping(o) {
          return {
            label: o,
            value: o
          };
        }));
        return $timeout(_.noop, 2000);
      },
      onNext: function () {
        console.log(userInput.uaaUrl);
        console.log(userInput.uaaUrlSkipSsl);
        console.log(userInput.consoleClient);
        console.log(userInput.consoleSecret);
        console.log(userInput.consoleAdmin);
        console.log(userInput.consolePassword);
        console.log(userInput.consoleScope);
        return $timeout(_.noop, 2000).then(function () {
          return $q.reject('nooooo');
        });
      },
      isLastStep: true
    };

    vm.wizardOptions = {
      workflow: {
        disableJump: true,
        allowCancelAtLastStep: true,
        allowBack: function () {
          return true;
        },
        title: 'app-setup.wizard-title',
        btnText: {
          cancel: 'buttons.cancel',
          back: 'buttons.previous'
        },
        steps: [stepUaa1, stepUaa2]
      }
    };

    // Actions for the wizard controller
    vm.wizardActions = {
      stop: function () {
        vm.showWizard = false;
        userInput = {};
        $uibModalInstance.dismiss();
      },

      finish: function () {
        //TODO: RC Refresh app after pause? Does anything need to restart backend?

        // $uibModalInstance.close();
        // $state.go('cf.applications.application.summary', {
        //   cnsiGuid: vm.userInput.serviceInstance.guid,
        //   guid: newAppGuid,
        //   newlyCreated: false
        // });
        // resetSocket();
      }
    };

  }

})();
