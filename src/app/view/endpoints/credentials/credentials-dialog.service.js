(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.credentialsDialog', CredentialsDialogFactory);

  CredentialsDialogFactory.$inject = [
    'helion.framework.widgets.detailView',
    'app.model.modelManager',
    'app.view.notificationsService'
  ];

  function CredentialsDialogFactory(detailView, modelManager, notificationsService) {
    return {
      /**
       * @memberof app.view
       * @name credentialsDialog
       * @function show
       * @param {object} context - the context for the credentials dialog.
       * @returns {object} Dialog object for chaining promises and closing the dialog
       */
      show: function (context) {
        return detailView(
          {
            templateUrl: 'app/view/endpoints/credentials/credentials-dialog.html',
            class: 'detail-view-thin'
          },
          context
        );
      },

      /**
       * @memberof app.view
       * @name credentialsDialog
       * @function connect
       * @param {string} cnsiGuid - the cnsi guid of the service to connect to
       * @param {string} cnsiName - the user provided name of the cnsi service
       * @param {string} username - credentials to connect with
       * @param {string} password - credentials to connect with
       * @param {string} showNotification - show a notification message on successful connect
       * @returns {object} promise object
       */
      connect: function (cnsiGuid, cnsiName, username, password, showNotification) {
        var that = this;
        return modelManager.retrieve('app.model.serviceInstance.user').connect(cnsiGuid, cnsiName, username, password)
          .then(function success(response) {
            if (showNotification) {
              that.notify(cnsiName);
            }
            return response;
          });
      },

      /**
       * @memberof app.view
       * @name credentialsDialog
       * @function notify
       * @param {string} cnsiName - the user provided name of the cnsi service/endpoint
       */
      notify: function (cnsiName) {
        notificationsService.notify('success', gettext("Successfully connected to '") + cnsiName + "'");
      }
    };
  }

})();
