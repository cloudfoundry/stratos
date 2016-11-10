(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.credentialsDialog', CredentialsDialogFactory);

  CredentialsDialogFactory.$inject = [
    'helion.framework.widgets.detailView'
  ];

  function CredentialsDialogFactory(detailView) {
    return {
      /**
       * @memberof app.view
       * @name credentialsDialog
       * @param {object} context - the context for the credentials dialog.
       * @returns {object} Dialog object for chaining promises and closing the dialog
       */
      show: function (context) {
        return detailView(
          {
            templateUrl: 'app/view/service-registration/credentials/credentials-dialog.html',
            class: 'detail-view-thin'
          },
          context
        );
      }
    };
  }

})();
