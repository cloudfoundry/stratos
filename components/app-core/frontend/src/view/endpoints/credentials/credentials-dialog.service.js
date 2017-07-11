(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('appCredentialsDialog', CredentialsDialogFactory);

  function CredentialsDialogFactory($translate, $q, frameworkAsyncTaskDialog, modelManager, appNotificationsService) {

    return {
      /**
       * @memberof app.view
       * @name appCredentialsDialog
       * @param {string=} cnsiGuid - The GUID of the cloud-foundry server.
       * @param {string=} formName - the name of the credentials form
       * @returns {object} Dialog object for chaining promises and closing the dialog
       */
      show: function (cnsiGuid, formName) {

        var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');

        var config = {
          title: 'endpoints.connect.title',
          templateUrl: 'app/view/endpoints/credentials/credentials-form.html',
          submitCommit: true,
          buttonTitles: {
            submit: 'endpoints.connect.connect-button'
          },
          class: 'dialog-form',
          dialog: true
        };

        // Pull in specific properties to ensure context.data is free from incoming context
        var context = {
          cnsi: cnsiGuid,
          formName: formName
        };
        context.data = {};

        return frameworkAsyncTaskDialog(config, context, connect);

        /**
         * @function connect
         * @memberOf app.view.appCredentialsDialog
         * @description Connect service instance for user
         * @returns {object} promise
         */
        function connect() {
          return userServiceInstanceModel.connect(context.cnsi.guid, context.cnsi.name, context.data.username, context.data.password)
            .then(function success() {
              appNotificationsService.notify('success', $translate.instant('endpoints.connect.success-notification', {name: context.cnsi.name}));
              context.data = {};
            })
            .catch(function (response) {
              // Only reset these on fail, for success the dialog is removed
              context.errorMsg = null;
              context.failedRegister = null;

              if (response.status === -1) {
                context.errorMsg = 'endpoints.connect.error-no-connect';
              } else {
                if (response.status >= 400) {
                  if (response.status >= 500) {
                    context.errorMsg = 'endpoints.connect.error-server-failure';
                  } else {
                    context.failedRegister = true;
                    context.errorMsg = 'endpoints.connect.error-user-input';
                  }
                }
              }
              return $q.reject();
            });
        }
      }
    };
  }

})();
