(function () {
  'use strict';

  angular
    .module('app-setup.view', [])
    .factory('appSetupWizardService', DeployAppService)
    .controller('app-setup.view.appSetupController', AppSetupController);

  function DeployAppService(frameworkDetailView) {

    return {
      show: show
    };

    /**
     * @memberof appSetupWizardService
     * @name show
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
   * @name appSetupWizardService
   * @constructor
   * @param {object} $uibModalInstance - the angular $uibModalInstance service used to close/dismiss a modal
   * @param {object} $q - the angular $q service
   * @param {object} $translate - the angular $translate service
   * @param {object} $window - the angular $window service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} appUtilsService - the appUtilsService service
   * @param {object} modelManager - the model manager service
   */
  function AppSetupController($uibModalInstance, $q, $translate, $window, $timeout, appUtilsService, modelManager) {

    var vm = this;

    var templatePath = 'plugins/app-setup/view/wizard/';

    var data = {
      urlValidationExpr: appUtilsService.urlValidationExpression,
      consoleScopes: []
    };

    var userInput = { };

    var stepUaa1 = {
      title: 'app-setup.step-1.title',
      templateUrl: templatePath + 'setup-step-1.html',
      formName: 'step1',
      data: data,
      userInput: userInput,
      stepCommit: false,
      showBusyOnNext: 'app-setup.step-1.busy-message',
      onNext: function () {
        var setupModel = modelManager.retrieve('app-setup.model.setup');
        return setupModel.setup({
          uaa_endpoint: userInput.uaaUrl,
          console_client: userInput.consoleClient,
          console_client_secret: userInput.consoleSecret,
          skip_ssl_validation: userInput.uaaUrlSkipSsl ? userInput.uaaUrlSkipSsl.toString() : 'false',
          username: userInput.consoleAdmin,
          password: userInput.consolePassword
        })
          .then(function (response) {
            var scopes = response.data.scope;
            [].push.apply(data.consoleScopes, _.map(scopes, function selectOptionMapping(o) {
              if (o === 'stratos.admin') {
                userInput.consoleScope = o;
              }
              return {
                label: o,
                value: o
              };
            }));
            if (data.consoleScopes.length === 0) {
              return $q.reject('No UAA scopes found');
            }
          })
          .catch(function (response) {
            var error = _.isString(response.data) ? response.data : _.isString(response.data.error) ? response.data.error : '';
            var i18n = _.isString(error) ? 'app-setup.step-1.error-request-reason' : 'app-setup.step-1.error-request';
            return $q.reject($translate.instant(i18n, {reason: error}), response);
          });
      }
    };
    var stepUaa2 = {
      title: 'app-setup.step-2.title',
      templateUrl: templatePath + 'setup-step-2.html',
      formName: 'step2',
      data: data,
      userInput: userInput,
      showBusyOnNext: 'app-setup.step-2.busy-message',
      onNext: function () {
        var setupModel = modelManager.retrieve('app-setup.model.setup');
        return setupModel.update({
          console_admin_scope: userInput.consoleScope
        })
          .then(function () {
            // Give it some time to kick in
            return $timeout(_.noop, 7000);
          })
          .catch(function (response) {
            var error = _.isString(response.data) ? response.data : _.isString(response.data.error) ? response.data.error : '';
            var i18n = _.isString(error) ? 'app-setup.step-2.error-request-reason' : 'app-setup.step-2.error-request';
            return $q.reject($translate.instant(i18n, {reason: error}), response);
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
          back: 'buttons.previous',
          next: 'buttons.next'
        },
        steps: [stepUaa1, stepUaa2]
      }
    };

    // Actions for the wizard controller
    vm.wizardActions = {
      stop: function () {
        // vm.showWizard = false;
        userInput = {};
        $uibModalInstance.dismiss();
      },

      finish: function () {
        $uibModalInstance.close();
        $window.location.reload();
      }
    };

  }

})();
