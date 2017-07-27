(function () {
  'use strict';

  angular
    .module('cf-app-push')
    .factory('appDeployStepSourceService', AppDeployStepSourceService);

  function AppDeployStepSourceService($q, $translate, appUtilsService) {

    var CF_IGNORE_FILE = '.cfignore';
    var CF_DEFAULT_IGNORES = '.cfignore\n_darcs\n.DS_Store\n.git\n.gitignore\n.hg\n.svn\n';

    var gitHubUrlBase = 'https://github.com/';

    return {
      getStep: function (session, $scope) {

        // Watch for the file or folder being selected by the input field and process
        $scope.$watch(function () {
          return session.userInput.localPathFile;
        }, function (newVal, oldVal) {
          if (newVal && oldVal !== newVal) {
            handleFileInputSelect(newVal);
          }
        });

        var data = session.data.source;
        var userInput = session.userInput.source;

        data.githubBranches = [];
        userInput.githubProject = '';
        userInput.localPath = '';
        userInput.localPathFile = '';
        userInput.fileScanData = '';

        return {
          step: {
            title: 'deploy-app-dialog.step-source.title',
            templateUrl: 'plugins/cf-app-push/view/deploy-app-workflow/deploy-step-source/deploy-step-source.html',
            formName: 'deploy-info-form',
            data: data,
            userInput: userInput,
            folderSupport: isInputDirSupported(),
            showBusyOnEnter: 'deploy-app-dialog.step-source.busy',
            nextBtnText: 'deploy-app-dialog.button-deploy',
            stepCommit: true,
            bytesToHumanSize: appUtilsService.bytesToHumanSize,
            allowNext: function () {
              //TODO: RC wire in properly
              return userInput.sourceType === 'github' && userInput.git.isValid() || userInput.sourceType === 'local' && userInput.fileScanData;
            },
            dropItemHandler: dropHandler
          },
          destroy: angular.noop
        };
      }
    };

    function selectBranch(data, userInput, branch) {
      var foundBranch = _.find(data.githubBranches, function (o) {
        return o.value && o.value.name === branch;
      });
      userInput.githubBranch = foundBranch ? foundBranch.value : undefined;
    }

    /*
     * Handle a drop event
     */
    function dropHandler(data, userInput, items) {
      userInput.cfIgnoreFile = false;
      // Find out what has been dropped and take appropriate action
      itemDropHelper.identify(items).then(function (info) {
        userInput.localPath = info.value ? info.value.name : '';
        if (info.isFiles) {
          vm.options.wizardCtrl.showBusy('deploy-app-dialog.step-info.scanning');
          itemDropHelper.traverseFiles(info.value, CF_IGNORE_FILE, CF_DEFAULT_IGNORES).then(function (results) {
            userInput.fileScanData = results;
            userInput.sourceType = 'local';
            userInput.cfIgnoreFile = results.foundIgnoreFile;
          }).finally(function () {
            vm.options.wizardCtrl.showBusy();
          });
        } else if (info.isArchiveFile) {
          userInput.sourceType = 'local';
          var res = itemDropHelper.initScanner();
          userInput.fileScanData = res.addFile(info.value);
          userInput.sourceType = 'local';
        } else if (info.isWebLink) {
          // Check if this is a GitHub link
          if (info.value.toLowerCase().indexOf(gitHubUrlBase) === 0) {
            userInput.sourceType = 'github';
            var urlParts = info.value.substring(gitHubUrlBase.length).split('/');
            if (urlParts.length > 1) {
              var branch;
              if (urlParts.length > 3 && urlParts[2] === 'tree') {
                branch = urlParts[3];
              }
              var project = urlParts[0] + '/' + urlParts[1];
              if (userInput.githubProject === project) {
                // Project is the same, so just change the branch
                selectBranch(branch ? branch : data.githubProject.default_branch);
              } else {
                userInput.autoSelectGithubBranch = branch;
                userInput.githubProject = project;
              }
            }
          }
        }
      });
    }

    /*
     * Not all browsers allows a folder to be selected by an input field
     */
    function isInputDirSupported() {
      /* eslint-disable angular/document-service */
      var tmpInput = document.createElement('input');
      /* eslint-enable angular/document-service */
      return 'webkitdirectory' in tmpInput;
    }

    // Handle result of a file input form field selection
    function handleFileInputSelect(data, userInput, items) {
      // File list from a file input form field
      var res, rootFolderName, cfIgnoreFile;
      res = itemDropHelper.initScanner(CF_DEFAULT_IGNORES);
      userInput.cfIgnoreFile = false;
      if (items.length === 1) {
        if (itemDropHelper.isArchiveFile(items[0].name)) {
          userInput.fileScanData = res.addFile(items[0]);
          userInput.sourceType = 'local';
          userInput.localPath = items[0].name;
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
          userInput.cfIgnoreFile = !!ignores;
          res.rootFolderName = rootFolderName;
          _.each(items, function (file) {
            res.addFile(file);
          });
          userInput.fileScanData = res;
          userInput.sourceType = 'local';
          userInput.localPath = rootFolderName || $translate.instant('deploy-app-dialog.step-info.local.folder');
        });
      }
    }

  }

})();
