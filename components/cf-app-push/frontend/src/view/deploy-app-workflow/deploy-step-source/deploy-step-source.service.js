(function () {
  'use strict';

  angular
    .module('cf-app-push')
    .factory('appDeployStepSourceService', AppDeployStepSourceService);

  /**
   * @memberof appDeployStepSourceService
   * @name AppDeployStepSourceService
   * @constructor
   * @param {object} itemDropHelper - the item drop helper service
   */
  function AppDeployStepSourceService(itemDropHelper) {

    return {
      getStep: function (session) {

        var data = {
          folderSupport: isInputDirSupported(),
          dropInfo: undefined
        };
        data.dropItemHandler = _.partial(dropHandler, _, data);
        data.sourceTypeOptions = [
          {
            value: 'github',
            label: 'deploy-app-dialog.step-source.github.label'
          },
          {
            value: 'local',
            label: data.folderSupport ? 'deploy-app-dialog.step-source.local.folder.label' : 'deploy-app-dialog.step-source.local.file.label'
          }
        ];

        var userInput = session.userInput.source;
        var wizardData = session.wizard;

        userInput.githubProject = '';
        userInput.localPath = '';
        userInput.fileScanData = undefined;

        return {
          step: {
            title: 'deploy-app-dialog.step-source.title',
            templateUrl: 'plugins/cf-app-push/view/deploy-app-workflow/deploy-step-source/deploy-step-source.html',
            formName: 'deploy-info-form',
            data: data,
            userInput: userInput,
            wizard: wizardData,
            showBusy: function (msg) {
              session.showBusy(msg);
            },
            showBusyOnEnter: 'deploy-app-dialog.step-source.busy',
            nextBtnText: 'deploy-app-dialog.button-deploy',
            stepCommit: true,
            allowNext: function () {
              return wizardData.sourceType === 'github' && _.get(data, 'git.valid') ||
                wizardData.sourceType === 'local' && _.get(data, 'source.valid');
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
