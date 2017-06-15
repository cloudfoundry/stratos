(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list.deployApplication', [])
    .factory('appDeployAppService', DeployAppService)
    .controller('cloud-foundry.view.applications.list.deployAppController', DeployAppController);

  function DeployAppService(frameworkDetailView) {
    return {
      /**
       * @memberof appDeployAppService
       * @name deploy
       * @constructor
       * @param {object} context - the context for the modal. Used to pass in data
       */
      deploy: function (context) {
        return frameworkDetailView(
          {
            detailViewTemplateUrl: 'plugins/cloud-foundry/view/applications/workflows/deploy-app-workflow/deploy-app.html',
            controller: DeployAppController,
            controllerAs: 'deployApp'
          },
          context
        );
      }
    };
  }

  /**
   * @memberof cloud-foundry.view.dashboard.cluster
   * @name AssignUsersWorkflowController
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @param {object} $translate - the angular $translate service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} context - the context for the modal. Used to pass in data
   * @param {object} appClusterRolesService - the console roles service. Aids in selecting, assigning and removing roles with the
   * roles table.
   * @param {object} cfOrganizationModel - the cfOrganizationModel service
   * @param {object} $stateParams - the angular $stateParams service
   * @param {object} $q - the angular $q service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $uibModalInstance - the angular $uibModalInstance service used to close/dismiss a modal
   */
  function DeployAppController($q, $timeout, $uibModalInstance, modelManager) {

    var vm = this;

    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    vm.data = {
      serviceInstances: []
    };

    vm.userInput = {
      serviceInstance: null,
      organization: null,
      space: null
    };

    var path = 'plugins/cloud-foundry/view/applications/workflows/deploy-app-workflow/';

    var allowBack = true;
    var deploying = false;

    vm.options = {
      workflow: {
        allowJump: false,
        allowCancelAtLastStep: false,
        allowBack: function () {
          return allowBack;
        },
        title: 'deploy-app-dialog.title',
        btnText: {
          cancel: 'buttons.cancel',
          back: 'buttons.previous'
        },
        steps: [
          {
            title: 'deploy-app-dialog.step1.title',
            templateUrl: path + 'deploy-app-bits.html',
            formName: 'deploy-info-form',
            data: vm.data,
            userInput: vm.userInput,
            onEnter: function () {
              return serviceInstanceModel.list()
                .then(function (serviceInstances) {
                  var validServiceInstances = _.chain(_.values(serviceInstances))
                    .filter({cnsi_type: 'cf', valid: true})
                    .filter(function (cnsi) {
                      return authModel.doesUserHaveRole(cnsi.guid, authModel.roles.space_developer);
                    })
                    .map(function (o) {
                      return {label: o.name, value: o};
                    })
                    .value();
                  [].push.apply(vm.data.serviceInstances, validServiceInstances);

                });
            },
            onNext: function () {
              return $q.resolve();
            }
          },
          {
            title: 'deploy-app-dialog.step2.title',
            templateUrl: path + 'deploy-app-manifest.html',
            formName: 'deploy-manifest-form',
            data: vm.data,
            userInput: vm.userInput,
            nextBtnText: 'deploy-app-dialog.step2.button-yes',
            stepCommit: true,
            showBusyOnEnter: 'deploy-app-dialog.step2.busy',
            onEnter: function () {
              // TODO: Upload (zip file|github url), cf + org + space guids
              // var fd = new FormData();
              // fd.append("file", files[0]);
              // $http.post(settings.apiBaseUri + "/files", fd,

              // TODO: Resolve promise when we get back manifest data
              // TODO: Add progress indicator
              // TODO: Handle errors
              //TODO: ONLY RESOLVE ONCE DEPLOY SUCCESSFULLY STARTED
              return $timeout(function () {
                console.log('manifest received');
              }, 3000);
            },
            onNext: function () {
              deploying = true;
              // TODO: Add progress indicator
              // TODO: Handle errors
              return $q.resolve();
            }
          },
          {
            title: 'deploy-app-dialog.step3.title',
            templateUrl: path + 'deploy-app-log.html',
            data: vm.data,
            userInput: vm.userInput,
            cancelBtnText: 'Close',
            allowNext: function () {
              return !deploying;
            },
            onEnter: function () {
              allowBack = false;
              $timeout(function () {
                deploying = false;
              }, 5000);
              return $q.resolve();
            },
            onNext: function () {
              // TODO: Handle errors
              return $q.resolve();
            }
          },
          {
            title: 'deploy-app-dialog.step4.title',
            templateUrl: path + 'deploy-app-result.html',
            data: vm.data,
            userInput: vm.userInput,
            onNext: function () {
              return $q.resolve();
            },
            nextBtnText: 'Close',
            isLastStep: true
          }
        ]
      }
    };

    // Actions for the wizard controller
    this.actions = {
      stop: function () {
        $uibModalInstance.dismiss();
      },

      finish: function () {
        $uibModalInstance.close();
      }
    };

  }

})();
