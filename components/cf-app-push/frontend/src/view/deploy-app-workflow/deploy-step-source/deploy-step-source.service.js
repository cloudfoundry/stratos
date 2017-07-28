(function () {
  'use strict';

  angular
    .module('cf-app-push')
    .factory('appDeployStepSourceService', AppDeployStepSourceService);

  function AppDeployStepSourceService(itemDropHelper, appUtilsService) {

    return {
      getStep: function (session) {

        var data = session.data.source;
        var userInput = session.userInput.source;
        var wizard = session.wizard;
        // var showBusy = ;

        data.githubBranches = [];
        data.folderSupport = isInputDirSupported();
        data.bytesToHumanSize = appUtilsService.bytesToHumanSize;
        data.dropItemHandler = _.partial(dropHandler, _, data);
        data.dropInfo = undefined;
        userInput.githubProject = '';
        userInput.localPath = '';
        userInput.fileScanData = '';

        return {
          step: {
            title: 'deploy-app-dialog.step-source.title',
            templateUrl: 'plugins/cf-app-push/view/deploy-app-workflow/deploy-step-source/deploy-step-source.html',
            formName: 'deploy-info-form',
            data: data,
            userInput: userInput,
            wizard: wizard,
            showBusy: function (msg) {
              session.showBusy(msg);
            },
            showBusyOnEnter: 'deploy-app-dialog.step-source.busy',
            nextBtnText: 'deploy-app-dialog.button-deploy',
            stepCommit: true,
            allowNext: function () {
              //TODO: RC wire in properly
              // return vm.userInput.sourceType === 'github' && vm.userInput.githubProjectValid || vm.userInput.sourceType === 'local' && angular.isDefined(vm.userInput.fileScanData);
              return session.wizard.sourceType === 'github' && _.get(data, 'git.valid') ||
                session.wizard.sourceType === 'local' && _.get(data, 'source.valid');
            }
          },
          destroy: angular.noop
        };
      }
    };


    /*
     * Handle a drop event
     */
    function dropHandler(items, data) {
      // Find out what has been dropped and take appropriate action
      itemDropHelper.identify(items).then(function (info) {
        data.dropInfo = info;
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

  }

})();
