(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.manageVcsTokens', ManageVcsTokensService);

  ManageVcsTokensService.$inject = [
    '$q',
    'app.model.modelManager',
    'app.view.notificationsService',
    'helion.framework.widgets.asyncTaskDialog',
    'app.utils.utilsService'
  ];

  /**
   * @name ManageVcsTokensService
   * @description Manage tokens for a VCS
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager The console model manager service
   * @param {helion.framework.widgets.asyncTaskDialog} asyncTaskDialog The framework async detail view
   * @property {function} add Opens slide out containing registration form
   * @constructor
   */
  function ManageVcsTokensService($q, modelManager, asyncTaskDialog) {

    return {
      /**
       * @name manage
       * @description Opens a slide-out to manage VCS tokens
       * @namespace app.view.registerService.ServiceRegistrationService
       * @param {object} $scope - the angular scope object
       * @returns {promise}
       */
      manage: function (vcs) {
        var context = {
          vcs: vcs,
          description: gettext('<p>A web-based Git hosting service, providing access control, bug tracking, feature requests, task management, and wikis for every project.</p>' +
            '<p>You can connect to your public github vcs server by creating a Personal Access Token and provising the given string here. Personal access tokens work the same as' +
            ' OAuth tokens. This will allow Stackato to connect and access your GitHub</p>')
        };

        return asyncTaskDialog(
          {
            title: gettext('Manage GitHub tokens'),
            templateUrl: 'app/view/endpoints/vcs/manage-vcs.html',
            class: 'detail-view',
            buttonTitles: {
              submit: gettext('Connect Account')
            }
          },
          context,
          function () {
            if (context.customErrorMsg) {
              delete context.errorMsg;
              delete context.customErrorMsg;
            }
            return $q.resolve();
          }
        ).result;
      }
    };
  }

})();
