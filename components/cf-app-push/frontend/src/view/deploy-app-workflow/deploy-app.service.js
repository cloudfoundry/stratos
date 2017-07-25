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
   * @param {object} itemDropHelper - the item drop helper service
   * @param {object} appUtilsService - the App Utils service
   */
  function DeployAppController($scope, $q, $uibModalInstance, $state, $location, $websocket, $translate, $log, $http,
                               $timeout, $filter, modelManager, itemDropHelper, appUtilsService) {

    var vm = this;

    var CF_IGNORE_FILE = '.cfignore';
    var CF_DEFAULT_IGNORES = '.cfignore\n_darcs\n.DS_Store\n.git\n.gitignore\n.hg\n.svn\n';

    var gitHubUrlBase = 'https://github.com/';

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
      CLOSE_PUSH_ERROR: 40000,
      CLOSE_NO_MANIFEST: 40001,
      CLOSE_INVALID_MANIFEST: 40002,
      CLOSE_FAILED_CLONE: 40003,
      CLOSE_FAILED_NO_BRANCH: 40004,
      CLOSE_FAILURE: 40005,
      CLOSE_NO_SESSION: 40006,
      CLOSE_NO_CNSI: 40007,
      CLOSE_NO_CNSI_USERTOKEN: 40008,
      EVENT_CLONED: 10000,
      EVENT_FETCHED_MANIFEST: 10001,
      EVENT_PUSH_STARTED: 10002,
      EVENT_PUSH_COMPLETED: 10003,
      SOURCE_REQUIRED: 30000,
      SOURCE_GITHUB: 30001,
      SOURCE_FOLDER: 30002,
      SOURCE_FILE: 30003,
      SOURCE_FILE_DATA: 30004,
      SOURCE_FILE_ACK: 30005
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
      },
      sourceType: 'github',
      localPath: '',
      localPathFile: null,
      fileScanData: null
    };

    /*
     * Not all browsers allows a folder to be selected by an input field
     */
    function isInputDirSupported() {
      /* eslint-disable angular/document-service */
      var tmpInput = document.createElement('input');
      /* eslint-enable angular/document-service */
      return 'webkitdirectory' in tmpInput;
    }

    vm.folderSupport = isInputDirSupported();

    var stepInfo = {
      title: 'deploy-app-dialog.step-info.title',
      templateUrl: templatePath + 'deploy-app-bits.html',
      formName: 'deploy-info-form',
      data: vm.data,
      userInput: vm.userInput,
      folderSupport: vm.folderSupport,
      showBusyOnEnter: 'deploy-app-dialog.step-info.busy',
      nextBtnText: 'deploy-app-dialog.button-deploy',
      stepCommit: true,
      bytesToHumanSize: appUtilsService.bytesToHumanSize,
      allowNext: function () {
        return vm.userInput.sourceType === 'github' && vm.userInput.githubProjectValid || vm.userInput.sourceType === 'local' && angular.isDefined(vm.userInput.fileScanData);
      },
      dropItemHandler: dropHandler,
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

    /*
     * Handle a drop event
     */
    function dropHandler(items) {
      vm.userInput.cfIgnoreFile = false;
      // Find out what has been dropped and take appropriate action
      itemDropHelper.identify(items).then(function (info) {
        vm.userInput.localPath = info.value ? info.value.name : '';
        if (info.isFiles) {
          vm.options.wizardCtrl.showBusy('deploy-app-dialog.step-info.scanning');
          itemDropHelper.traverseFiles(info.value, CF_IGNORE_FILE, CF_DEFAULT_IGNORES).then(function (results) {
            vm.userInput.fileScanData = results;
            vm.userInput.sourceType = 'local';
            vm.options.wizardCtrl.showBusy();
            vm.userInput.cfIgnoreFile = results.foundIgnoreFile;
          });
        } else if (info.isArchiveFile) {
          vm.userInput.sourceType = 'local';
          var res = itemDropHelper.initScanner();
          vm.userInput.fileScanData = res.addFile(info.value);
          vm.userInput.sourceType = 'local';
        } else if (info.isWebLink) {
          // Check if this is a GitHub link
          if (info.value.toLowerCase().indexOf(gitHubUrlBase) === 0) {
            vm.userInput.sourceType = 'github';
            var urlParts = info.value.substring(gitHubUrlBase.length).split('/');
            if (urlParts.length > 1) {
              var branch;
              if (urlParts.length > 3 && urlParts[2] === 'tree') {
                branch = urlParts[3];
              }
              var project = urlParts[0] + '/' + urlParts[1];
              if (vm.userInput.githubProject === project) {
                // Project is the same, so just change the branch
                vm.selectBranch(branch ? branch : vm.data.githubProject.default_branch);
              } else {
                vm.userInput.autoSelectGithubBranch = branch;
                vm.userInput.githubProject = project;
              }
            }
          }
        }
      });
    }

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
        initControllers: function (wizardCtrl) {
          vm.options.wizardCtrl = wizardCtrl;
        },
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

    vm.selectBranch = function (branch) {
      var foundBranch = _.find(vm.data.githubBranches, function (o) {
        return o.value && o.value.name === branch;
      });
      vm.userInput.githubBranch = foundBranch ? foundBranch.value : undefined;
    };

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

              var branch = vm.userInput.autoSelectGithubBranch ? vm.userInput.autoSelectGithubBranch : vm.data.githubProject.default_branch;
              vm.userInput.autoSelectGithubBranch = undefined;
              var foundBranch = _.find(vm.data.githubBranches, function (o) {
                return o.value && o.value.name === branch;
              });
              vm.userInput.githubBranch = foundBranch ? foundBranch.value : undefined;
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

    // Watch for the file or folder being selected by the input field and process
    $scope.$watch(function () {
      return vm.userInput.localPathFile;
    }, function (newVal, oldVal) {
      if (newVal && oldVal !== newVal) {
        handleFileInputSelect(newVal);
      }
    });

    // Handle result of a file input form field selection
    function handleFileInputSelect(items) {
      // File list from a file input form field
      var res, rootFolderName, cfIgnoreFile;
      res = itemDropHelper.initScanner(CF_DEFAULT_IGNORES);
      vm.userInput.cfIgnoreFile = false;
      if (items.length === 1) {
        if (itemDropHelper.isArchiveFile(items[0].name)) {
          vm.userInput.fileScanData = res.addFile(items[0]);
          vm.userInput.sourceType = 'local';
          vm.userInput.localPath = items[0].name;
        }
      } else {
        // See if we can find the .cfignore file
        for (var j = 0; j < items.length; j++) {
          var filePath = items[j].webkitRelativePath.split('/');
          // First part is the root folder name
          if (filePath.length === 2 && !rootFolderName) {
            rootFolderName = filePath[0];
          }
          if (filePath.length > 2) {
            break;
          } else if (filePath.length === 2 && filePath[1] === CF_IGNORE_FILE) {
            cfIgnoreFile = items[j];
            break;
          }
        }

        var promise = $q.resolve('');
        // Did we find an ignore file?
        if (cfIgnoreFile) {
          promise = itemDropHelper.readFileContents(cfIgnoreFile);
        }

        promise.then(function (ignores) {
          res = itemDropHelper.initScanner(CF_DEFAULT_IGNORES + ignores);
          vm.userInput.cfIgnoreFile = !!ignores;
          res.rootFolderName = rootFolderName;
          _.each(items, function (file) {
            res.addFile(file);
          });
          vm.userInput.fileScanData = res;
          vm.userInput.sourceType = 'local';
          vm.userInput.localPath = rootFolderName || $translate.instant('deploy-app-dialog.step-info.local.folder');
        });
      }
    }

    function createSocketUrl(serviceInstance, org, space) {
      var protocol = $location.protocol() === 'https' ? 'wss' : 'ws';
      var url = protocol + '://' + $location.host() + ':' + $location.port();
      url += '/pp/v1/' + serviceInstance.guid + '/' + org.metadata.guid + '/' + space.metadata.guid + '/deploy';
      url += '?org=' + org.entity.name + '&space=' + space.entity.name;
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
        vm.data.uploadingFiles = undefined;
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

      function sendSourceMetadata() {
        if (vm.userInput.sourceType === 'github') {
          sendGitHubSourceMetadata();
        } else if (vm.userInput.sourceType === 'local') {
          sendLocalSourceMetadata();
        }
      }

      function sendGitHubSourceMetadata() {
        var github = {
          project:vm.userInput.githubProject,
          branch: vm.userInput.githubBranch.name
        };

        var msg = {
          message: angular.toJson(github),
          timestamp: Math.round((new Date()).getTime() / 1000),
          type: socketEventTypes.SOURCE_GITHUB
        };

        // Send the source metadata
        vm.data.webSocket.send(angular.toJson(msg));
      }

      function sendLocalSourceMetadata() {
        var metadata = {
          files: [],
          folders: []
        };

        collectFoldersAndFiles(metadata, null, vm.userInput.fileScanData.root);

        vm.userInput.fileTransfers = metadata.files;
        metadata.files = metadata.files.length;
        vm.data.uploadingFiles = {
          remaining: metadata.files,
          bytes: 0,
          total: vm.userInput.fileScanData.total,
          fileName: ''
        };

        deployingPromise.resolve();

        var msg = {
          message: angular.toJson(metadata),
          timestamp: Math.round((new Date()).getTime() / 1000),
          type: socketEventTypes.SOURCE_FOLDER
        };

        // Send the source metadata
        vm.data.webSocket.send(angular.toJson(msg));
      }

      function collectFoldersAndFiles(metadata, base, folder) {
        _.each(folder.files, function (file) {
          var filePath = base ? base + '/' + file.name : file.name;
          file.fullPath = filePath;
          metadata.files.push(file);
        });

        _.each(folder.folders, function (sub, name) {
          var fullPath = base ? base + '/' + name : name;
          metadata.folders.push(fullPath);
          collectFoldersAndFiles(metadata, fullPath, sub);
        });
      }

      function sendNextFile() {
        if (vm.userInput.fileTransfers.length > 0) {
          var file = vm.userInput.fileTransfers.shift();

          // Send file metadata
          var msg = {
            message: file.fullPath,
            timestamp: Math.round((new Date()).getTime() / 1000),
            type: socketEventTypes.SOURCE_FILE
          };

          vm.data.uploadingFiles.fileName = file.fullPath;

          // Send the file name metadata
          vm.data.webSocket.send(angular.toJson(msg));

          // Now send the file data as a binary message
          var reader = new FileReader();
          reader.onload = function (e) {
            var output = e.target.result;
            vm.data.webSocket.send(output);
            vm.data.uploadingFiles.bytes += file.size;
          };
          reader.readAsArrayBuffer(file);
        }
      }

      resetSocket();

      // Determine web socket url and open connection
      var socketUrl = createSocketUrl(vm.userInput.serviceInstance, vm.userInput.organization, vm.userInput.space);

      vm.data.webSocket = $websocket(socketUrl, null, {
        reconnectIfNotNormalClose: false,
        binaryType: 'arraybuffer'
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
          case socketEventTypes.SOURCE_REQUIRED:
            sendSourceMetadata();
            break;
          case socketEventTypes.SOURCE_FILE_ACK:
            sendNextFile();
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
