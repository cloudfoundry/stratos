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
   * @param {object} $q - the angular $q service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $uibModalInstance - the angular $uibModalInstance service used to close/dismiss a modal
   * @param {object} $state - the angular $state service
   * @param {app.model.modelManager} modelManager - the Model management service
   */
  function DeployAppController($scope, $q, $timeout, $uibModalInstance, $state, modelManager) {

    var vm = this;

    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');
    // var buildPacks = modelManager.retrieve('cloud-foundry.model.build-pack');

    vm.data = {
      serviceInstances: [],
      buildPacks: [],
      webSocketUrl: 'wss://invalid'
    };

    vm.userInput = {
      serviceInstance: null,
      organization: null,
      space: null,
      manifest: {
        location: '/manifest.yml',
        mbMemory: 1024,
        mbDiskQuota: 1024,
        instances: 1
      }
    };

    $scope.$watch(function () {
      return vm.userInput.file;
    }, function (val) {
      if (val) {
        vm.userInput.filename = val.name;
      } else {
        vm.userInput.filename = '';
      }
    });

    var path = 'plugins/cloud-foundry/view/applications/workflows/deploy-app-workflow/';

    var allowBack = true;
    // var deploying = false;

    vm.options = {
      workflow: {
        allowJump: false,
        allowCancelAtLastStep: true,
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
            showBusyOnEnter: 'deploy-app-dialog.step1.busy',
            allowNext: function () {
              return vm.userInput.file || vm.userInput.github;
            },
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
                }).catch(function () {
                  return $q.reject('deploy-app-dialog.step1.enter-failed');
                });
            },
            onNext: function () {
              return $q.resolve();
              // return submitBits();
            }
          },
          {
            title: 'deploy-app-dialog.step2.title',
            templateUrl: path + 'deploy-app-manifest.html',
            formName: 'deploy-manifest-form',
            data: vm.data,
            userInput: vm.userInput,
            nextBtnText: 'deploy-app-dialog.step2.button-next',
            stepCommit: true,
            showBusyOnEnter: 'deploy-app-dialog.step2.busy',
            onEnter: function () {
              // Upload/Process bits here to allow the wizard 'busy' process to handle screen in progress content
              // var fetchBuildPacksPromise = buildPacks.listAllBuildPacks(vm.userInput.serviceInstance.guid).then(function (response) {
              //   [].push.apply(vm.data.buildPacks, _.map(response.resources, cfUtilsService.selectOptionMapping));
              // });
              // return $q.all(submitManifest());
              return submitBits().catch(function () {
                return $q.reject('deploy-app-dialog.step2.submit-failed');
              });
            },
            onNext: function () {
              // deploying = true;
            }
          },
          {
            title: 'deploy-app-dialog.step3.title',
            templateUrl: path + 'deploy-app-log.html',
            data: vm.data,
            userInput: vm.userInput,
            cancelBtnText: 'buttons.close',
            nextBtnText: 'deploy-app-dialog.step3.next-button',
            showBusyOnEnter: 'deploy-app-dialog.step3.busy',
            allowNext: function () {
              return true;
              // return !deploying;
            },
            onEnter: function () {
              allowBack = false;
              waitForDeploy();
              return submitManifest().catch(function () {
                //TODO: Is the user ALWAYS safe to retry this step?
                return $q.reject('deploy-app-dialog.step3.submit-failed');
              });
              // return waitForDeploy().then(function () {
              //   //TODO: Automatically move to the next step
              // });
            },
            isLastStep: true
          }
          // ,
          // {
          //   title: 'deploy-app-dialog.step4.title',
          //   templateUrl: path + 'deploy-app-result.html',
          //   data: vm.data,
          //   userInput: vm.userInput,
          //   onNext: function () {
          //     return $q.resolve();
          //   },
          //   nextBtnText: 'Close',
          //   isLastStep: true
          // }
        ]
      }
    };

    // Actions for the wizard controller
    vm.actions = {
      stop: function () {
        $uibModalInstance.dismiss();
      },

      finish: function () {
        $uibModalInstance.close();
        console.error('TODO: Must receive new app\'s guid from back end');
        $state.go('cf.applications.application.summary', {
          cnsiGuid: vm.userInput.serviceInstance.guid,
          guid: '',
          newlyCreated: 'true'
        });
      }
    };

    function submitBits() {
      // TODO: Upload (zip file|github url), cf + org + space guids
      // var fd = new FormData();
      // fd.append("file", files[0]);
      // $http.post(settings.apiBaseUri + "/files", fd,

      // TODO: Expect manifest data in response (vm.userInfo.manifest.x)
      // TODO: Handle errors
      return $timeout(function () {
        console.log('bits sent and processed');
      }, 2000);
    }

    function submitManifest() {
      // TODO: Expect web socker url in response (vm.userInfo.webSockerUrl)
      return $timeout(function () {
        console.log('manifest sent and deploy started');
      }, 2000);
    }

    function waitForDeploy() {
      // TODO: Watch socket for success deploy event
      $timeout(function () {
        // deploying = false;
      }, 5000);
      return $q.resolve();
    }

  }

})();
