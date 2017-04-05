(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('appCredentialsDialog', CredentialsDialogFactory);

  function CredentialsDialogFactory(frameworkDetailView) {
    return {
      /**
       * @memberof app.view
       * @name appCredentialsDialog
       * @param {object} context - the context for the credentials dialog.
       * @returns {object} Dialog object for chaining promises and closing the dialog
       */
      show: function (context) {
        return frameworkDetailView(
          {
            templateUrl: 'app/view/endpoints/credentials/credentials-dialog.html',
            class: 'detail-view-thin'
          },
          context
        );
      }
    };
  }

})();
