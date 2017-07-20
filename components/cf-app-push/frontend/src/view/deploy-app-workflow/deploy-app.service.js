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
          class: 'dialog-form-wizard'
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
        icon: 'add_to_queue',
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
   * @param {object} $q - the angular $q service
   * @param {object} $uibModalInstance - the angular $uibModalInstance service used to close/dismiss a modal
   * @param {object} $state - the angular $state service
   * @param {object} $location - the angular $location service
   * @param {object} $websocket - the angular $websocket service
   * @param {object} $translate - the angular $translate service
   * @param {object} $log - the angular $log service
   * @param {object} $http - the angular $http service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $filter - the angular $filter service
   * @param {app.model.modelManager} modelManager - the Model management service
   */
  function DeployAppController($scope, $q, $uibModalInstance, $state, $location, $websocket, $translate, $log, $http,
                               $timeout, $filter, modelManager) {

    var vm = this;

    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    var hasPushStarted, newAppGuid, discoverAppTimer;

    // How often to check for the app being created
    var DISCOVER_APP_TIMER_PERIOD = 2000;

    var allowBack = false;

    var templatePath = 'plugins/cf-app-push/view/deploy-app-workflow/';

    var socketEventTypes = {
      DATA: 20000,
      MANIFEST: 20001,
      CLOSE_SUCCESS: 20002,
      CLOSE_PUSH_ERROR: 40003,
      CLOSE_NO_MANIFEST: 40004,
      CLOSE_INVALID_MANIFEST: 40005,
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

    vm.data = {
      serviceInstances: [],
      logFilter: logFilter,
      deployState: {
        UNKNOWN: 1,
        CLONED: 2,
        FETCHED_MANIFEST: 3,
        PUSHING: 4,
        DEPLOYED: 5,
        FAILED: 6,
        SOCKET_OPEN: 7
      },
      githubBranches: []
    };

    vm.userInput = {
      serviceInstance: null,
      organization: null,
      space: null,
      githubProject: '',
      manifest: {
        location: '/manifest.yml'
      }
    };

    var stepInfo = {
      title: 'deploy-app-dialog.step-info.title',
      templateUrl: templatePath + 'deploy-app-bits.html',
      formName: 'deploy-info-form',
      data: vm.data,
      userInput: vm.userInput,
      showBusyOnEnter: 'deploy-app-dialog.step-info.busy',
      nextBtnText: 'deploy-app-dialog.button-deploy',
      stepCommit: true,
      allowNext: function () {
        return vm.userInput.githubProjectValid;
      },
      onEnter: function () {
        allowBack = false;
        if (vm.data.deployStatus) {
          // Previously been at this step, no need to fetch instances again
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
    var stepDeploying = {
      title: 'deploy-app-dialog.step-deploying.title',
      templateUrl: templatePath + 'deploy-app-deploying.html',
      data: vm.data,
      userInput: vm.userInput,
      cancelBtnText: 'buttons.close',
      nextBtnText: 'deploy-app-dialog.step-deploying.next-button',
      showBusyOnEnter: 'deploy-app-dialog.step-deploying.busy',
      allowNext: function () {
        return !!newAppGuid;
      },
      onEnter: function () {
        allowBack = false;
        return startDeploy().catch(function (error) {
          allowBack = false;
          return $q.reject($translate.instant('deploy-app-dialog.step-deploying.submit-failed', {reason: error}));
        });
      },
      isLastStep: true
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
        $uibModalInstance.dismiss({reload: !!hasPushStarted});
        resetSocket();
      },

      finish: function () {
        $uibModalInstance.close();
        $state.go('cf.applications.application.summary', {
          cnsiGuid: vm.userInput.serviceInstance.guid,
          guid: newAppGuid,
          newlyCreated: false
        });
        resetSocket();
      }
    };

    $scope.$on('$destroy', resetSocket);
    $scope.$on('$destroy', function () {
      $timeout.cancel(discoverAppTimer);
    });

    var debounceGithubProjectFetch = _.debounce(function () {
      var project = vm.userInput.githubProject;
      if (!project || project.length === 0) {
        vm.userInput.githubProjectValid = false;
        return;
      }

      $http.get('https://api.github.com/repos/' + project)
        .then(function (response) {
          vm.userInput.githubProjectValid = true;
          vm.data.githubProject = response.data;
          vm.userInput.githubProjectCached = project;

          $http.get('https://api.github.com/repos/' + project + '/branches')
            .then(function (response) {
              vm.data.githubBranches.length = 0;
              [].push.apply(vm.data.githubBranches, _.map(response.data, function selectOptionMapping(o) {
                return {
                  label: o.name,
                  value: o
                };
              }));
            })
            .catch(function () {
              vm.data.githubBranches.length = 0;
            });

        })
        .catch(function (response) {
          if (response.status === 404) {
            vm.userInput.githubProjectValid = false;
            vm.data.githubBranches.length = 0;
            delete vm.userInput.githubBranch;
            delete vm.data.githubCommit;
          }
        });
    }, 1000);

    $scope.$watch(function () {
      return vm.userInput.githubProject;
    }, function (oldVal, newVal) {
      if (oldVal !== newVal) {
        debounceGithubProjectFetch();
      }
    });

    $scope.$watch(function () {
      return vm.userInput.githubBranch;
    }, function (newVal, oldVal) {
      if (newVal && oldVal !== newVal) {
        $http.get('https://api.github.com/repos/' + vm.userInput.githubProject + '/commits/' + newVal.commit.sha)
          .then(function (response) {
            vm.data.githubCommit = response.data;
          })
          .catch(function () {
            delete vm.data.githubCommit;
          });
      }
    });

    function createSocketUrl(serviceInstance, org, space, project, branch) {
      var protocol = $location.protocol() === 'https' ? 'wss' : 'ws';
      var url = protocol + '://' + $location.host() + ':' + $location.port();
      url += '/pp/v1/' + serviceInstance.guid + '/' + org.metadata.guid + '/' + space.metadata.guid + '/deploy';
      url += '?project=' + project + '&org=' + org.entity.name + '&space=' + space.entity.name;
      if (branch) {
        url += '&branch=' + branch;
      }
      return url;
    }

    function resetSocket() {
      if (vm.data.webSocket) {
        vm.data.webSocket.onMessage = _.noop;
        vm.data.webSocket.onClose = _.noop;
        vm.data.webSocket.close(true);
      }
    }

    function discoverAppGuid(appName) {
      if (discoverAppTimer) {
        return;
      }

      // Poll every 2 seconds to try and locate the app once it has been created
      discoverAppTimer = $timeout(function () {
        var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
        var params = {
          q: 'name:' + appName
        };
        spaceModel.listAllAppsForSpace(vm.userInput.serviceInstance.guid, vm.userInput.space.metadata.guid, params)
          .then(function (apps) {
            if (apps.length === 1) {
              newAppGuid = apps[0].metadata.guid;
            }
          })
          .finally(function () {
            discoverAppTimer = undefined;
            // Did not find the app - try again
            if (!newAppGuid) {
              discoverAppGuid(appName);
            }
          });
      }, DISCOVER_APP_TIMER_PERIOD);
    }

    function logFilter(messageObj) {
      if (messageObj.type !== socketEventTypes.DATA) {
        return '';
      }

      return $filter('momentDateFormat')(messageObj.timestamp * 1000) + ': ' + messageObj.message.trim() + '\n';
    }

    function startDeploy() {
      vm.data.deployStatus = vm.data.deployState.UNKNOWN;
      hasPushStarted = false;
      newAppGuid = null;

      var deployingPromise = $q.defer();

      function pushStarted() {
        hasPushStarted = true;
        vm.data.deployStatus = vm.data.deployState.PUSHING;
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
        vm.data.deployFailure = $translate.instant('deploy-app-dialog.step-deploying.title-deploy-failed', {reason: failureDescription});
        deployingPromise.reject(failureDescription);
        $log.warn('Deploy Application: Failed: ' + failureDescription);
      }

      resetSocket();

      // Determine web socket url and open connection
      var socketUrl = createSocketUrl(vm.userInput.serviceInstance, vm.userInput.organization, vm.userInput.space,
        vm.userInput.githubProject, vm.userInput.githubBranch.name);

      vm.data.webSocket = $websocket(socketUrl, null, {
        reconnectIfNotNormalClose: false
      });

      // Handle Connection responses
      vm.data.webSocket.onOpen(function () {
        vm.data.deployStatus = vm.data.deployState.SOCKET_OPEN;
      });

      /* eslint-disable complexity */
      vm.data.webSocket.onMessage(function (message) {
        var logData = angular.fromJson(message.data);

        switch (logData.type) {
          case socketEventTypes.DATA:
            // Ignore, handled by custom log viewer filter
            break;
          case socketEventTypes.CLOSE_FAILED_CLONE:
          case socketEventTypes.CLOSE_FAILED_NO_BRANCH:
          case socketEventTypes.CLOSE_FAILURE:
          case socketEventTypes.CLOSE_INVALID_MANIFEST:
          case socketEventTypes.CLOSE_NO_MANIFEST:
          case socketEventTypes.CLOSE_PUSH_ERROR:
          case socketEventTypes.CLOSE_NO_SESSION:
          case socketEventTypes.CLOSE_NO_CNSI:
          case socketEventTypes.CLOSE_NO_CNSI_USERTOKEN:
            var type = _.findKey(socketEventTypes, function (type) {
              return type === logData.type;
            });
            deployFailed('deploy-app-dialog.socket.event-type.' + type);
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
            pushStarted();
            $log.debug('Deploy Application: Push Started');
            break;
          case socketEventTypes.EVENT_PUSH_COMPLETED:
            $log.debug('Deploy Application: Push Completed');
            break;
          case socketEventTypes.MANIFEST:
            var manifest = angular.fromJson(logData.message);
            var app = _.get(manifest, 'Applications[0]', {});
            if (app.Name) {
              discoverAppGuid(app.Name);
            }
            break;
          default:
            $log.error('Unknown deploy application socket event type: ', logData.type);
            break;
        }

      });
      /* eslint-enable complexity */

      vm.data.webSocket.onClose(function () {
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
