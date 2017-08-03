(function () {
  'use strict';

  angular
    .module('cf-app-push')
    .factory('appDeployAppService', DeployAppService)
    .controller('cf-app-push.deployAppController', DeployAppController);

  function DeployAppService(frameworkDetailView, cfAppWallActions) {

    return {
      deploy: deploy,
      register: register
    };

    /**
     * @memberof appDeployAppService
     * @name deploy
     * @param {object?} context - the context for the modal. Used to pass in data
     * @returns {object} frameworkDetailView promise
     */
    function deploy(context) {
      return frameworkDetailView(
        {
          detailViewTemplateUrl: 'plugins/cf-app-push/view/deploy-app-workflow/deploy-app.html',
          controller: DeployAppController,
          controllerAs: 'deployApp',
          dialog: true,
          class: 'dialog-form-wizard deploy-app-wizard'
        },
        context
      );
    }

    /**
     * @memberof appDeployAppService
     * @name register
     */
    function register() {
      cfAppWallActions.actions.push({
        id: 'app-wall-deploy-application-btn',
        name: 'app-wall.deploy-application',
        icon: 'file_upload',
        position: 2,
        hidden: function () {
          var hidden = _.get(this.context, 'hidden');
          if (angular.isFunction(hidden)) {
            return hidden();
          }
          return false;
        },
        disabled: function () {
          var disabled = _.get(this.context, 'disabled');
          if (angular.isFunction(disabled)) {
            return disabled();
          }
          return false;
        },
        execute: function () {
          var reload = _.get(this.context, 'reload');
          deploy().result.catch(function (result) {
            // Do we need to reload the app collection to show the newly added app?
            if (_.get(result, 'reload') && angular.isFunction(reload)) {
              // Note - this won't show the app if the user selected a different cluster/org/guid than that of the filter
              reload();
            }
          });
        }
      });
    }
  }

  /**
   * @memberof appDeployAppService
   * @name DeployAppController
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @param {object} $uibModalInstance - the angular $uibModalInstance service used to close/dismiss a modal
   * @param {object} $state - the angular $state service
   * @param {object} appDeployStepDestinationService - Service to provide the destination step (org/space of the app)
   * @param {object} appDeployStepSourceService - Service to provide the source step (where the app source come from)
   * @param {object} appDeployStepDeployingService - Service to provide the deploying step
   */
  function DeployAppController($scope, $uibModalInstance, $state, appDeployStepDestinationService,
                               appDeployStepSourceService, appDeployStepDeployingService) {

    var vm = this;

    // Contains the info the user has submitted in all steps and any vars that are used in multiple wizard steps
    var session = {
      userInput: {
        deploying: {},
        destination: {},
        source: {}
      },
      wizard: {
        allowBack: true
      }
    };

    var stepLocation = appDeployStepDestinationService.getStep(session);
    var stepSource = appDeployStepSourceService.getStep(session);
    var stepDeploy = appDeployStepDeployingService.getStep(session);

    function destroy() {
      stepLocation.destroy();
      stepSource.destroy();
      stepDeploy.destroy();
      session = null;
    }

    vm.options = {
      workflow: {
        initControllers: function (wizardCtrl) {
          session.showBusy = wizardCtrl.showBusy;
        },
        disableJump: true,
        allowCancelAtLastStep: true,
        allowBack: function () {
          return session ? session.wizard.allowBack : false;
        },
        title: 'deploy-app-dialog.title',
        btnText: {
          cancel: 'buttons.cancel',
          back: 'buttons.previous'
        },
        steps: [stepLocation.step, stepSource.step, stepDeploy.step]
      }
    };

    // Actions for the wizard controller
    vm.actions = {
      stop: function () {
        $uibModalInstance.dismiss({reload: !!session.wizard.hasPushStarted});
        destroy();
      },

      finish: function () {
        $uibModalInstance.close();
        $state.go('cf.applications.application.summary', {
          cnsiGuid: session.userInput.destination.serviceInstance.guid,
          guid: session.wizard.newAppGuid,
          newlyCreated: false
        });
        destroy();
      }
    };

    $scope.$on('$destroy', destroy);

  }

})();
