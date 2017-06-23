(function () {
  'use strict';

  // 'ab-base64'
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
   * @param {object} $q - the angular $q service
   * @param {object} $uibModalInstance - the angular $uibModalInstance service used to close/dismiss a modal
   * @param {object} $state - the angular $state service
   * @param {object} $location - the angular $location service
   * @param {object} $websocket - the angular $websocket service
   * @param {object} $interval - the angular $interval service
   * @param {object} $translate - the angular $translate service
   * @param {app.model.modelManager} modelManager - the Model management service
   */
  function DeployAppController($q, $uibModalInstance, $state, $location, $websocket, $interval, $translate,
                               modelManager) {

    var vm = this;

    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    var stopPollingForAppGuid, polling, newAppGuid;

    vm.data = {
      serviceInstances: [],
      logFilter: logFilter
    };

    vm.userInput = {
      serviceInstance: null,
      organization: null,
      space: null,
      manifest: {
        location: '/manifest.yml'
      }
    };

    // $scope.$watch(function () {
    //   return vm.userInput.file;
    // }, function (val) {
    //   if (val) {
    //     vm.userInput.filename = val.name;
    //   } else {
    //     vm.userInput.filename = '';
    //   }
    // });

    var path = 'plugins/cloud-foundry/view/applications/workflows/deploy-app-workflow/';

    var stepInfo = {
      title: 'deploy-app-dialog.step-info.title',
      templateUrl: path + 'deploy-app-bits.html',
      formName: 'deploy-info-form',
      data: vm.data,
      userInput: vm.userInput,
      showBusyOnEnter: 'deploy-app-dialog.step-info.busy',
      nextBtnText: 'deploy-app-dialog.button-deploy',
      stepCommit: true,
      // allowNext: function () {
      //   return vm.userInput.file || vm.userInput.github;
      // },
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
            return $q.reject('deploy-app-dialog.step-info.enter-failed');
          });
      }
    };
    var stepManifest = {
      title: 'deploy-app-dialog.step-manifest.title',
      templateUrl: path + 'deploy-app-manifest.html',
      formName: 'deploy-manifest-form',
      data: vm.data,
      userInput: vm.userInput,
      nextBtnText: 'deploy-app-dialog.button-deploy',
      stepCommit: true,
      showBusyOnEnter: 'deploy-app-dialog.step-manifest.busy',
      onEnter: function () {
        // Note: Upload (zip file|github url), cf + org + space guids
        // Note: Expect manifest data in response (vm.userInfo.manifest.x)
        return submitBits().catch(function () {
          return $q.reject('deploy-app-dialog.step-manifest.submit-failed');
        });
      },
      onNext: function () {
        // deploying = true;
      }
    };
    var stepDeploying = {
      title: 'deploy-app-dialog.step-deploying.title',
      templateUrl: path + 'deploy-app-deploying.html',
      data: vm.data,
      userInput: vm.userInput,
      cancelBtnText: 'buttons.close',
      nextBtnText: 'deploy-app-dialog.step-deploying.next-button',
      showBusyOnEnter: 'deploy-app-dialog.step-deploying.busy',
      allowNext: function () {
        return newAppGuid;
      },
      onEnter: function () {
        return startDeploy().catch(function (error) {
          return $q.reject($translate.instant('deploy-app-dialog.step-deploying.submit-failed', { reason: error }));
        });
      },
      isLastStep: true
    };

    vm.options = {
      workflow: {
        disableJump: true,
        allowCancelAtLastStep: true,
        allowBack: function () {
          return false;
        },
        title: 'deploy-app-dialog.title',
        btnText: {
          cancel: 'buttons.cancel',
          back: 'buttons.previous'
        },
        steps: [stepInfo, stepDeploying]
      }
    };

    // Actions for the wizard controller
    vm.actions = {
      stop: function () {
        $uibModalInstance.dismiss();
      },

      finish: function () {
        $uibModalInstance.close();
        $state.go('cf.applications.application.summary', {
          cnsiGuid: vm.userInput.serviceInstance.guid,
          guid: newAppGuid,
          newlyCreated: 'false'
        });
      }
    };

    // var coloredLog = appUtilsService.coloredLog;
    function logFilter(messageObj) {
      // console.log(messageObj);
      // return JSON.stringify(messageObj);
      //TODO: event is either for log (convert to something the cf-log-viewer filter works with) OR for this service. Ignore the latter (handled above)
      // if (messageObj.type !== deployAppSocketMessage.LOG) {
      //   return '';
      // }

      // messageObj = {
      //   message: base64.encode('hello world'),
      //   timestamp: 1498064230908392507,
      //   type: 3
      // };
      //
      // CF timestamps are in milliseconds
      // var msStamp = Math.round(messageObj.timestamp / 1000);
      // console.log(messageObj.timestamp, messageObj.message);
      return moment(messageObj.timestamp * 1000).format('HH:mm:ss') + ': ' + messageObj.message.trim() + '\n';
    }

    function createSocketUrl(serviceInstance, org, space, project, branch) {
      var protocol = $location.protocol() === 'https' ? 'wss' : 'ws';
      var url = protocol + '://' + $location.host() + ':' + $location.port();
      // var url = 'wss://ddb03543.ngrok.io';
      url += '/pp/v1/' + serviceInstance.guid + '/' + org.metadata.guid + '/' + space.metadata.guid + '/deploy';
      url += '?project=' + project + '&org=' + org.entity.name + '&space=' + space.entity.name;
      if (branch) {
        url += '&branch=' + branch;
      }
      return url;
    }

    function discoverAppGuid() {
      var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      return spaceModel.listAllAppsForSpace(vm.userInput.serviceInstance.guid, vm.userInput.space.metadata.guid)
        .then(function (apps) {
          var app = _.find(apps, 'entity.name', 'go-env-rc');
          if (app) {
            newAppGuid = app.metadata.guid;
          }
        });
    }

    function pollForAppGuid() {
      stopPollingForAppGuid = $interval(function () {
        if (polling) {
          return;
        }
        polling = true;
        discoverAppGuid().then(function () {
          if (newAppGuid) {
            stopPollingForAppGuid();
          }
          polling = false;
        });
      }, 3000);
    }

    function startDeploy() {
      vm.data.deployed = undefined;
      // $timeout(function () {
      //   // vm.data.deployed = true;
      // }, 5000);
      //
      // return $timeout(function () {
      // }, 1000);

      var socketUrl = createSocketUrl(vm.userInput.serviceInstance, vm.userInput.organization, vm.userInput.space,
        vm.userInput.githubProject, vm.userInput.githubBranch);

      vm.data.webSocket = $websocket(socketUrl, null, {
        reconnectIfNotNormalClose: false
      });

      var deployingPromise = $q.defer();

      vm.data.webSocket.onOpen(function () {
        pollForAppGuid();
        vm.data.deployed = null;
        deployingPromise.resolve();
      });

      vm.data.webSocket.onClose(function (event) {
        if (stopPollingForAppGuid) {
          stopPollingForAppGuid();
        }
        console.log('CLOSING: ', event);
        if (vm.data.deployed === null) {
          vm.data.deployed = true;
          //TODO: Determine if failed to open or successfully finished (currently fails case where fails half way through)
        } else {
          vm.data.deployed = false;
          deployingPromise.reject('Failed to open connection');
        }
      });

      return $q.all(deployingPromise, discoverAppGuid());
    }
  }

})();
