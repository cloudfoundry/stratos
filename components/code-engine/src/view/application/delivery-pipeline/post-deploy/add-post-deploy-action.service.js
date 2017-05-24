(function () {
  'use strict';

  angular
    .module('code-engine.view.application.delivery-pipeline')
    .factory('cePostDeployActionService', postDeployAction);

  postDeployAction.$inject = [
    'modelManager',
    'apiManager',
    'frameworkAsyncTaskDialog'
  ];

  /**
   * @name postDeployAction
   * @description Factory to get Add Post-Deploy Action dialog
   * @constructor
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.api.apiManager} apiManager - the API management service
   * @param {helion.framework.widgets.frameworkAsyncTaskDialog} frameworkAsyncTaskDialog - Async Task Dialog service
   */
  function postDeployAction(modelManager, apiManager, frameworkAsyncTaskDialog) {

    this.userServiceInstance = modelManager.retrieve('app.model.serviceInstance.user');
    this.hceModel = modelManager.retrieve('code-engine.model.hce');
    this.hceSecurityApi = apiManager.retrieve('code-engine.api.HceSecurityApi');

    var that = this;

    return {

      /**
       * @name add
       * @description Display Edit App Dialog
       * @param {String} cnsiGuid - CNSI GUID
       * @param {String} hceProjectId - HCE Project ID
       * @returns {*} frameworkAsyncTaskDialog
       */
      add: function (cnsiGuid, hceProjectId) {

        var addStormRunnerTask = function (data) {

          // Store Credentials
          var credentialData = {
            credential_type: 'USERNAME_PASSWORD',
            credential_key: data.userName,
            credential_value: data.password
          };

          return that.hceSecurityApi.storeCredential(cnsiGuid, credentialData, {}, that.hceModel.hceProxyPassthroughConfig)
            .then(function (response) {
              if (response.data.credential_id) {
                return response.data.credential_id;
              }
              throw new Error('Request to create credentials failed! Response was: ' + angular.toJson(response));
            })
            .then(function (credentialId) {
              // Create Storm runner
              var metadata = {
                storm_runner_tenant_id: data.tenantId,
                storm_runner_test_id: data.testId,
                storm_runner_project_id: data.projectId
              };

              return that.hceModel.addPipelineTask(cnsiGuid, hceProjectId, data.actionName, credentialId, metadata);
            });
        };

        var data = {
          userName: null,
          password: null,
          testId: null,
          tenantId: null,
          projectId: null,
          actionName: null
        };

        return frameworkAsyncTaskDialog(
          {
            title: gettext('Add Post Deploy Action'),
            templateUrl: 'plugins/code-engine/view/applications/' +
            'application/delivery-pipeline/post-deploy/add-post-deploy-action.html',
            submitCommit: true,
            buttonTitles: {
              submit: 'Add action'
            }
          },
          {
            data: data
          },
          addStormRunnerTask
        );
      }
    };
  }
})();
