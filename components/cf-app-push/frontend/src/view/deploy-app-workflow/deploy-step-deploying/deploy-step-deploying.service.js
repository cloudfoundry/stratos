(function () {
  'use strict';

  angular
    .module('cf-app-push')
    .factory('appDeployStepDeployingService', AppDeployStepDeployingService);

  /**
   * @memberof appDeployStepDeployingService
   * @name AppDeployStepDeployingService
   * @constructor
   * @param {object} $q - the angular $q service
   * @param {object} $location - the angular $location service
   * @param {object} $translate - the angular $translate service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $websocket - the angular $websocket service
   * @param {object} $log - the angular $log service
   * @param {object} $filter - the angular $filter service
   * @param {app.model.modelManager} modelManager - the Model management service
   */
  function AppDeployStepDeployingService($q, $location, $translate, $timeout, $websocket, $log, $filter, modelManager) {

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
      SOURCE_FILE_ACK: 30005,
      SOURCE_GITURL: 30006
    };

    // How often to check for the app being created
    var DISCOVER_APP_TIMER_PERIOD = 2000;

    var deployState = {
      UNKNOWN: 1,
      CLONED: 2,
      FETCHED_MANIFEST: 3,
      PUSHING: 4,
      DEPLOYED: 5,
      FAILED: 6,
      SOCKET_OPEN: 7
    };

    return {
      getStep: function (session) {
        var data = {
          deployState: deployState,
          logFilter: logFilter
        };
        var wizardData = session.wizard;

        var step = {
          title: 'deploy-app-dialog.step-deploying.title',
          templateUrl: 'plugins/cf-app-push/view/deploy-app-workflow/deploy-step-deploying/deploy-step-deploying.html',
          data: data,
          cancelBtnText: 'buttons.close',
          nextBtnText: 'deploy-app-dialog.step-deploying.next-button',
          showBusyOnEnter: 'deploy-app-dialog.step-deploying.busy',
          allowNext: function () {
            return !!wizardData.newAppGuid;
          },
          onEnter: function () {
            wizardData.allowBack = false;
            return startDeploy(session, data, step).catch(function (error) {
              wizardData.allowBack = true;
              return $q.reject($translate.instant('deploy-app-dialog.step-deploying.submit-failed', {reason: error}));
            });
          },
          isLastStep: true
        };

        return {
          step: step,
          destroy: function () {
            $timeout.cancel(data.discoverAppTimer);
            resetSocket(data.webSocket);
          }
        };
      }
    };

    function discoverAppGuid(wizardData, data, destinationUserInput, appName) {
      if (data.discoverAppTimer) {
        return;
      }

      // Poll every 2 seconds to try and locate the app once it has been created
      data.discoverAppTimer = $timeout(function () {
        var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
        var params = {
          q: 'name:' + appName
        };
        spaceModel.listAllAppsForSpace(destinationUserInput.serviceInstance.guid, destinationUserInput.space.metadata.guid, params)
          .then(function (apps) {
            if (apps.length === 1) {
              wizardData.newAppGuid = apps[0].metadata.guid;
            }
          })
          .finally(function () {
            data.discoverAppTimer = undefined;
            // Did not find the app - try again
            if (!wizardData.newAppGuid) {
              discoverAppGuid(wizardData, data, destinationUserInput, appName);
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

    function createSocketUrl(serviceInstance, org, space) {
      var protocol = $location.protocol() === 'https' ? 'wss' : 'ws';
      var url = protocol + '://' + $location.host() + ':' + $location.port();
      url += '/pp/v1/' + serviceInstance.guid + '/' + org.metadata.guid + '/' + space.metadata.guid + '/deploy';
      url += '?org=' + org.entity.name + '&space=' + space.entity.name;
      return url;
    }

    function startDeploy(session, data, step) {

      var wizardData = session.wizard;
      var destinationUserInput = session.userInput.destination;
      var sourceUserInput = session.userInput.source;

      data.deployStatus = deployState.UNKNOWN;
      wizardData.hasPushStarted = false;
      wizardData.newAppGuid = null;

      var deployingPromise = $q.defer();

      function pushStarted() {
        wizardData.hasPushStarted = true;
        data.deployStatus = deployState.PUSHING;
        deployingPromise.resolve();
        data.uploadingFiles = undefined;
        $log.debug('Deploy Application: Push Started');
      }

      function deploySuccessful(step) {
        data.deployStatus = deployState.DEPLOYED;
        $log.debug('Deploy Application: Deploy Successful');
        // Mark the wizard step as complete (so it gets a tick icon)
        step.complete = true;
      }

      function deployFailed(errorString) {
        wizardData.allowBack = true;
        data.deployStatus = deployState.FAILED;
        var failureDescription = $translate.instant(errorString);
        data.deployFailure = $translate.instant('deploy-app-dialog.step-deploying.title-deploy-failed', {reason: failureDescription});
        deployingPromise.reject(failureDescription);
        $log.warn('Deploy Application: Failed: ' + failureDescription);
      }

      function sendSourceMetadata() {
        var type = wizardData.sourceType;
        var userInput = sourceUserInput;
        if (type === 'example') {
          type = 'git';
          if (userInput.example.sourceType === 'github') {
            userInput = {
              gitType: 'github',
              githubProject: userInput.example.userInput.githubProject,
              githubBranch: userInput.example.userInput.githubBranch
            };
          } else if (userInput.example.sourceType === 'giturl') {
            userInput = {
              gitType: 'giturl',
              gitUrl: userInput.example.userInput.gitUrl,
              githubBranchName: userInput.example.userInput.gitUrlBranch
            };
          }
        }

        if (type === 'git') {
          sendGitMetadata(userInput);
        } else if (type === 'local') {
          sendLocalSourceMetadata();
        }
      }

      function sendGitMetadata(userInput) {
        if (userInput.gitType === 'github') {
          sendGitHubSourceMetadata(userInput.githubProject, userInput.githubBranch.name);
        } else if (userInput.gitType === 'giturl') {
          sendGitUrlSourceMetadata(userInput.gitUrl, userInput.githubBranchName);
        }
      }

      function sendGitHubSourceMetadata(githubProject, githubBranchName) {
        var github = {
          project: githubProject,
          branch: githubBranchName
        };

        var msg = {
          message: angular.toJson(github),
          timestamp: Math.round((new Date()).getTime() / 1000),
          type: socketEventTypes.SOURCE_GITHUB
        };

        // Send the source metadata
        data.webSocket.send(angular.toJson(msg));
      }

      function sendGitUrlSourceMetadata(gitUrl, githubBranchName) {
        var giturl = {
          url: gitUrl,
          branch: githubBranchName
        };

        var msg = {
          message: angular.toJson(giturl),
          timestamp: Math.round((new Date()).getTime() / 1000),
          type: socketEventTypes.SOURCE_GITURL
        };

        // Send the source metadata
        data.webSocket.send(angular.toJson(msg));
      }

      function sendLocalSourceMetadata() {
        var metadata = {
          files: [],
          folders: []
        };

        collectFoldersAndFiles(metadata, null, sourceUserInput.fileScanData.root);

        sourceUserInput.fileTransfers = metadata.files;
        metadata.files = metadata.files.length;
        data.uploadingFiles = {
          remaining: metadata.files,
          bytes: 0,
          total: sourceUserInput.fileScanData.total,
          fileName: ''
        };

        deployingPromise.resolve();

        var msg = {
          message: angular.toJson(metadata),
          timestamp: Math.round((new Date()).getTime() / 1000),
          type: socketEventTypes.SOURCE_FOLDER
        };

        // Send the source metadata
        data.webSocket.send(angular.toJson(msg));
      }

      function collectFoldersAndFiles(metadata, base, folder) {
        _.each(folder.files, function (file) {
          file.fullPath = base ? base + '/' + file.name : file.name;
          metadata.files.push(file);
        });

        _.each(folder.folders, function (sub, name) {
          var fullPath = base ? base + '/' + name : name;
          metadata.folders.push(fullPath);
          collectFoldersAndFiles(metadata, fullPath, sub);
        });
      }

      function sendNextFile() {
        if (sourceUserInput.fileTransfers.length > 0) {
          var file = sourceUserInput.fileTransfers.shift();

          // Send file metadata
          var msg = {
            message: file.fullPath,
            timestamp: Math.round((new Date()).getTime() / 1000),
            type: socketEventTypes.SOURCE_FILE
          };

          data.uploadingFiles.fileName = file.fullPath;

          // Send the file name metadata
          data.webSocket.send(angular.toJson(msg));

          // Now send the file data as a binary message
          var reader = new FileReader();
          reader.onload = function (e) {
            var output = e.target.result;
            data.webSocket.send(output);
            data.uploadingFiles.bytes += file.size;
          };
          reader.readAsArrayBuffer(file);
        }
      }

      resetSocket(data.webSocket);

      // Determine web socket url and open connection
      var socketUrl = createSocketUrl(destinationUserInput.serviceInstance, destinationUserInput.organization, destinationUserInput.space);

      data.webSocket = $websocket(socketUrl, null, {
        reconnectIfNotNormalClose: false,
        binaryType: 'arraybuffer'
      });

      // Handle Connection responses
      data.webSocket.onOpen(function () {
        data.deployStatus = deployState.SOCKET_OPEN;
      });

      /* eslint-disable complexity */
      data.webSocket.onMessage(function (message) {
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
            deploySuccessful(step);
            break;
          case socketEventTypes.EVENT_CLONED:
            data.deployStatus = deployState.CLONED;
            $log.debug('Deploy Application: Cloned');
            break;
          case socketEventTypes.EVENT_FETCHED_MANIFEST:
            data.deployStatus = deployState.FETCHED_MANIFEST;
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
              discoverAppGuid(wizardData, data, destinationUserInput, app.Name);
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

      data.webSocket.onClose(function () {
        if (data.deployStatus === deployState.UNKNOWN) {
          // Closed before socket has successfully opened
          deployFailed('deploy-app-dialog.socket.failed-connection');
        } else if (data.deployStatus !== deployState.DEPLOYED && data.deployStatus !== deployState.FAILED) {
          // Have connected to socket but not received a close message containing deploy result
          deployFailed('deploy-app-dialog.socket.failed-unknown');
        }
      });

      return deployingPromise.promise;
    }

    function resetSocket(webSocket) {
      if (webSocket) {
        webSocket.onMessage = _.noop;
        webSocket.onClose = _.noop;
        webSocket.close(true);
      }
    }

  }

})();
