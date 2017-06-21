(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list.deployApplication', ['ab-base64'])
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
  function DeployAppController($scope, $q, $timeout, $uibModalInstance, $state, $location, $websocket, base64, modelManager) {

    var vm = this;

    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    vm.data = {
      serviceInstances: [],
      logFilter: logFilter
      // buildPacks: [],
      // webSocketUrl: 'wss://invalid'
    };

    vm.userInput = {
      serviceInstance: null,
      organization: null,
      space: null,
      manifest: {
        location: '/manifest.yml'
        //   ,
        // mbMemory: 1024,
        // mbDiskQuota: 1024,
        // instances: 1
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

    var newAppGuid;

    vm.options = {
      workflow: {
        allowJump: false,
        allowCancelAtLastStep: true,
        allowBack: function () {
          return false;
        },
        title: 'deploy-app-dialog.title',
        btnText: {
          cancel: 'buttons.cancel',
          back: 'buttons.previous'
        },
        steps: [
          {
            title: 'deploy-app-dialog.step-info.title',
            templateUrl: path + 'deploy-app-bits.html',
            formName: 'deploy-info-form',
            data: vm.data,
            userInput: vm.userInput,
            showBusyOnEnter: 'deploy-app-dialog.step-info.busy',
            nextBtnText: 'deploy-app-dialog.button-deploy',
            stepCommit: true,
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
                  return $q.reject('deploy-app-dialog.step-info.enter-failed');
                });
            }
            // ,
            // onNext: function () {
            //   return $q.resolve();
            //   // return submitBits();
            // }
          },
          // {
          //   title: 'deploy-app-dialog.step-manifest.title',
          //   templateUrl: path + 'deploy-app-manifest.html',
          //   formName: 'deploy-manifest-form',
          //   data: vm.data,
          //   userInput: vm.userInput,
          //   nextBtnText: 'deploy-app-dialog.button-deploy',
          //   stepCommit: true,
          //   showBusyOnEnter: 'deploy-app-dialog.step-manifest.busy',
          //   onEnter: function () {
          //   // Note: Upload (zip file|github url), cf + org + space guids
          //   // Note: Expect manifest data in response (vm.userInfo.manifest.x)
          //     return submitBits().catch(function () {
          //       return $q.reject('deploy-app-dialog.step-manifest.submit-failed');
          //     });
          //   },
          //   onNext: function () {
          //     // deploying = true;
          //   }
          // },
          {
            title: 'deploy-app-dialog.step-deploying.title',
            templateUrl: path + 'deploy-app-log.html',
            data: vm.data,
            userInput: vm.userInput,
            cancelBtnText: 'buttons.close',
            nextBtnText: 'deploy-app-dialog.step-deploying.next-button',
            showBusyOnEnter: 'deploy-app-dialog.step-deploying.busy',
            allowNext: function () {
              return newAppGuid;
            },
            onEnter: function () {
              return startDeploy().catch(function () {
                //TODO: Is the user ALWAYS safe to retry this step?
                return $q.reject('deploy-app-dialog.step-deploying.submit-failed');
              });

              // return submitManifest()
              //   .then(function () {
              //     // TODO: Expected newly created/current app guid in response
              //     // TODO: Create log stream url from app guid (see uses of cfLogViewer)
              //     newAppGuid = '1234';
              //     vm.data.webSocketUrl = 'wss://1234';
              //   })
              //   .catch(function () {
              //     //TODO: Is the user ALWAYS safe to retry this step?
              //     return $q.reject('deploy-app-dialog.step-deploying.submit-failed');
              //   });
            },
            isLastStep: true
          }
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
        $state.go('cf.applications.application.summary', {
          cnsiGuid: vm.userInput.serviceInstance.guid,
          guid: newAppGuid,
          newlyCreated: 'false'
        });
      }
    };

    var deployAppSocketMessage = {
      START: 'x',
      LOG: 'y'
    };

    var coloredLog = appUtilsService.coloredLog;
    function logFilter(messageObj) {
      if (messageObj.type !== deployAppSocketMessage.LOG) {
        return '';
      }

      messageObj = {
        message: base64.encode('hello world'),
        timestamp: 1498064230908392507,
        type: 3
      };

      //TODO: event is either for log (convert to something the cf-log-viewer filter works with OR for this service. Ignore the latter (handled above)
      // CF timestamps are in nanoseconds
      var msStamp = Math.round(messageObj.timestamp / 1000000);

      return moment(msStamp).format('HH:mm:ss.SSS') + ': ' + coloredLog(base64.decode(messageObj.message)) + '\n';
    }

    function startDeploy() {
      var mockRequest = $q.resolve();
      var mockDeployStarted;
      return mockRequest
        .then(function () {
          var protocol = $location.protocol() === 'https' ? 'wss' : 'ws';
          var mockWebSocketUrl = protocol + '://' + $location.host() + ':' + $location.port() + '/pp/v1/' +
            '84ac2b65-3a9a-495f-ab5f-8d74a9b1cd9c' + '/apps/' + '54f684bd-1922-4796-b274-99e6da204974' + '/stream';

          vm.data.webSocket = $websocket(mockWebSocketUrl, null, {
            reconnectIfNotNormalClose: false
          });
          vm.data.webSocket.onMessage(function (message) {
            var messageObj = angular.fromJson(message.data);
            if (messageObj.type === deployAppSocketMessage.LOG) {
              return;
            }
            //TODO:
          }, {autoApply: true});

          mockDeployStarted = $timeout(_.noop, 2000);
        })
        .then(function () {
          // TODO: Start listening to log events/pass through to log viewer

          // TODO: Start listening to app guid events
          var appGuidPromise = $timeout(_.noop, 5000);
          appGuidPromise.then(function () {
            newAppGuid = '1234';
          });

          return mockDeployStarted;
        });
    }

    // TODO: JUNK
    // function submitBits() {
    //   // TODO: Upload (zip file|github url), cf + org + space guids
    //   // var fd = new FormData();
    //   // fd.append("file", files[0]);
    //   // $http.post(settings.apiBaseUri + "/files", fd,
    //
    //   // TODO: Expect manifest data in response (vm.userInfo.manifest.x)
    //   console.error('TODO: Must receive new app\'s guid from back end');
    //   // TODO: Handle errors
    //   return $timeout(function () {
    //     console.log('bits sent and processed');
    //   }, 2000);
    // }

    // function submitManifest() {
    //   return $timeout(function () {
    //
    //     console.log('manifest sent and deploy started');
    //   }, 2000);
    // }
    //
    // function waitForDeploy() {
    //   // TODO: Watch socket for success deploy event
    //   $timeout(function () {
    //     // deploying = false;
    //   }, 5000);
    //   return $q.resolve();
    // }

  }

})();
