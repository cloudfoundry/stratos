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
  function DeployAppController($q, $uibModalInstance, $state, $location, $websocket, $interval, $translate, $log,
                               modelManager) {

    var vm = this;

    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    var stopPollingForAppGuid, polling, newAppGuid;

    var allowBack = false;

    vm.data = {
      serviceInstances: [],
      logFilter: logFilter,
      deployState: {
        UNKNOWN: 1,
        CLONED: 2,
        FETCHED_MANIFEST: 3,
        DEPLOYING: 4,
        DEPLOYED: 5,
        FAILED: 6,
        SOCKET_OPEN: 7
      }
    };

    vm.userInput = {
      serviceInstance: null,
      organization: null,
      space: null,
      githubBranch: 'master',
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
      onEnter: function () {
        allowBack = false;
        if (vm.data.deployStatus) {
          return;
        }
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

    var socketEventTypes = {
      DATA: 20000,
      MANIFEST: 20001,
      CLOSE_SUCCESS: 20002,
      CLOSE_PUSH_ERROR: 40003,
      CLOSE_NO_MANIFEST: 40004,
      CLOSE_INVALID_MANIFEST:40005,
      CLOSE_FAILED_CLONE: 40006,
      CLOSE_FAILED_NO_BRANCH: 40007,
      CLOSE_FAILURE: 40008,
      CLOSE_NO_SESSION: 40009,
      CLOSE_NO_CNSI: 40010,
      CLOSE_NO_CNSI_USERTOKEN: 40011,
      EVENT_CLONED: 10012,
      EVENT_FETCHED_MANIFEST: 10013,
      EVENT_PUSH_STARTED: 10014,
      EVENT_PUSH_COMPLETED: 10015
    };

    vm.options = {
      workflow: {
        disableJump: true,
        allowCancelAtLastStep: true,
        allowBack: function () {
          return allowBack;
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

    function logFilter(messageObj) {
      if (messageObj.type !== socketEventTypes.DATA) {
        return '';
      }

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

    function discoverAppGuid(appName) {
      var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      return spaceModel.listAllAppsForSpace(vm.userInput.serviceInstance.guid, vm.userInput.space.metadata.guid)
        .then(function (apps) {
          var app = _.find(apps, 'entity.name', appName);
          if (app) {
            newAppGuid = app.metadata.guid;
          }
        });
    }

    function startDeploy() {
      vm.data.deployStatus = vm.data.deployState.UNKNOWN;

      var deployingPromise = $q.defer();

      function deployStarted() {
        vm.data.deployStatus = vm.data.deployState.DEPLOYING;
        deployingPromise.resolve();
        $log.debug('Deploy Application: Push Started');
      }

      function deploySuccessful() {
        vm.data.deployStatus = vm.data.deployState.DEPLOYED;
        $log.debug('Deploy Application: Deploy Successful');
      }

      function deployFailed(errorString) {
        allowBack = true;
        vm.data.deployStatus = vm.data.deployState.FAILED;
        var failureDescription = $translate.instant(errorString);
        vm.data.deployFailure = $translate.instant('deploy-app-dialog.step-deploying.title-deploy-failed', { reason:  failureDescription});
        deployingPromise.reject(failureDescription);
        $log.warn('Deploy Application: Failed: ' + failureDescription);
      }

      // Determine web socket url and open connection
      var socketUrl = createSocketUrl(vm.userInput.serviceInstance, vm.userInput.organization, vm.userInput.space,
        vm.userInput.githubProject, vm.userInput.githubBranch);

      vm.data.webSocket = $websocket(socketUrl, null, {
        reconnectIfNotNormalClose: false
      });

      // Handle Connection responses
      vm.data.webSocket.onOpen(function () {
        vm.data.deployStatus = vm.data.deployState.SOCKET_OPEN;
      });

      vm.data.webSocket.onMessage(function (message) {
        var logData = angular.fromJson(message.data);

        switch (logData.type) {
          case socketEventTypes.DATA:
            // Ignore, handled by custom log viewer filter
            break;
          case socketEventTypes.CLOSE_FAILED_CLONE:
            deployFailed('deploy-app-dialog.socket.event-type.CLOSE_FAILED_CLONE');
            break;
          case socketEventTypes.CLOSE_FAILED_NO_BRANCH:
            deployFailed('deploy-app-dialog.socket.event-type.CLOSE_FAILED_NO_BRANCH');
            break;
          case socketEventTypes.CLOSE_FAILURE:
            deployFailed('deploy-app-dialog.socket.event-type.CLOSE_FAILURE');
            break;
          case socketEventTypes.CLOSE_INVALID_MANIFEST:
            deployFailed('deploy-app-dialog.socket.event-type.CLOSE_INVALID_MANIFEST');
            break;
          case socketEventTypes.CLOSE_NO_MANIFEST:
            deployFailed('deploy-app-dialog.socket.event-type.CLOSE_NO_MANIFEST');
            break;
          case socketEventTypes.CLOSE_PUSH_ERROR:
            deployFailed('deploy-app-dialog.socket.event-type.CLOSE_PUSH_ERROR');
            break;
          case socketEventTypes.CLOSE_NO_SESSION:
            deployFailed('deploy-app-dialog.socket.event-type.CLOSE_NO_SESSION');
            break;
          case socketEventTypes.CLOSE_NO_CNSI:
            deployFailed('deploy-app-dialog.socket.event-type.CLOSE_NO_CNSI');
            break;
          case socketEventTypes.CLOSE_NO_CNSI_USERTOKEN:
            deployFailed('deploy-app-dialog.socket.event-type.CLOSE_NO_CNSI_USERTOKEN');
            break;
          case socketEventTypes.CLOSE_SUCCESS:
            deploySuccessful();
            break;
          case socketEventTypes.EVENT_CLONED:
            vm.data.deployStatus = vm.data.deployState.CLONED;
            $log.debug('Deploy Application: Cloned');
            break;
          case socketEventTypes.EVENT_FETCHED_MANIFEST:
            vm.data.deployStatus = vm.data.deployState.FETCHED_MANIFEST;
            $log.debug('Deploy Application: Fetched manifest');
            break;
          case socketEventTypes.EVENT_PUSH_STARTED:
            deployStarted();
            $log.debug('Deploy Application: Push Started');
            break;
          case socketEventTypes.EVENT_PUSH_COMPLETED:
            $log.debug('Deploy Application: Push Completed');
            break;
          case socketEventTypes.MANIFEST:
            console.log(logData);
            var manifest = angular.fromJson(logData.message);
            var app = _.get(manifest, 'Applications[0]', {});
            if (app.Name) {
              discoverAppGuid(app.Name);
            }
            break;
          default:
            $log.error('Unknown deploy application socket event type: ', logData.type);
            console.log(message);
            break;
        }

      });

      vm.data.webSocket.onClose(function (event) {
        console.log('CLOSING: ', event);
        if (vm.data.deployStatus === vm.data.deployState.UNKNOWN) {
          // Closed before socket has successfully opened
          deployFailed('deploy-app-dialog.socket.failed-connection');
        } else if (vm.data.deployStatus !== vm.data.deployState.DEPLOYED && vm.data.deployStatus !== vm.data.deployState.FAILED) {
          // Have connected to socket but not received a close message containing deploy result
          deployFailed('deploy-app-dialog.socket.failed-unknown');
        }
      });

      return deployingPromise.promise;
    }
  }

})();
