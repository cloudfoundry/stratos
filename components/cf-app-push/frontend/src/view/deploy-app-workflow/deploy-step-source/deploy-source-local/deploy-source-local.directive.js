(function () {
  'use strict';

  angular
    .module('cf-app-push')
    .directive('appDeploySourceLocal', DeploySourceLocal);

  /**
   * @namespace cf-app-push.accountActions
   * @memberof cf-app-push
   * @name DeploySourceGit
   * @description ????????
   * @returns {object} The ???????? directive definition object
   */
  function DeploySourceLocal() {
    return {
      scope: {
        sourceType: '=',
        userInput: '=',
        data: '=',
        formName: '@',
        valid: '=',
        dropInfo: '=',
        folderSupport: '=',
        showBusy: '='
      },
      bindToController: true,
      controller: DeploySourceLocalController,
      controllerAs: 'dplyLocalCtrl',
      templateUrl: 'plugins/cf-app-push/view/deploy-app-workflow/deploy-step-source/deploy-source-local/deploy-source-local.html'
    };
  }

  /**
   * @namespace cf-app-push.DeploySourceGitController
   * @memberof cf-app-push
   * @name DeploySourceGitController
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.model.consoleInfo} consoleInfo - the consoleInfo model
   * @constructor
   */
  function DeploySourceLocalController($timeout, $translate, $q, $scope, itemDropHelper) {
    var vm = this;

    vm.userInput.localPathFile = '';

    var CF_IGNORE_FILE = '.cfignore';
    var CF_DEFAULT_IGNORES = '.cfignore\n_darcs\n.DS_Store\n.git\n.gitignore\n.hg\n.svn\n';

    $scope.$watch(function () {
      //TODO: RC Improve - this should be valid if it has all the userInput fields required
      return vm.userInput.fileScanData;
    }, function () {
      vm.valid = angular.isDefined(vm.userInput.fileScanData);
    });

    // Watch for the file or folder being selected by the input field and process
    $scope.$watch(function () {
      return vm.userInput.localPathFile;
    }, function (newVal, oldVal) {
      if (newVal && oldVal !== newVal) {
        handleFileInputSelect(newVal);
      }
    });

    $scope.$watch(function () {
      return vm.dropInfo;
    }, function (newVal, oldVal) {
      if (oldVal !== newVal) {
        vm.cfIgnoreFile = false;
        var info = newVal;
        vm.userInput.localPath = info.value ? info.value.name : '';

        if (info.isFiles) {
          vm.showBusy('deploy-app-dialog.step-source.scanning');
          itemDropHelper.traverseFiles(info.value, CF_IGNORE_FILE, CF_DEFAULT_IGNORES).then(function (results) {
            vm.sourceType = 'local';
            vm.userInput.fileScanData = results;
            vm.cfIgnoreFile = results.foundIgnoreFile;
          }).finally(function () {
            vm.showBusy();
          });
        } else if (info.isArchiveFile) {
          // vm.sourceType = 'local';
          var res = itemDropHelper.initScanner();
          vm.userInput.fileScanData = res.addFile(info.value);
          vm.sourceType = 'local';
        }
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
          vm.sourceType = 'local';
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
          vm.sourceType = 'local';
          vm.userInput.localPath = rootFolderName || $translate.instant('deploy-app-dialog.step-info.local.folder');
        });
      }
    }

  }

})();
