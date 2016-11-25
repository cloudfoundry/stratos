(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.manageVcsTokens', ManageVcsTokensService);

  ManageVcsTokensService.$inject = [
    '$q',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog',
    'helion.framework.widgets.dialog.confirm',
    'app.view.notificationsService',
    'app.view.registerVcsToken'
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
  function ManageVcsTokensService($q, modelManager, asyncTaskDialog, confirmDialog, notificationsService, registerVcsToken) {
    var vcsModel = modelManager.retrieve('cloud-foundry.model.vcs');
    var tokenActions = [];
    var context = {
      refreshTokens: function () {
        return vcsModel.listVcsTokens().then(function (tokens) {
          context.tokens = _.filter(tokens, function (t) {
            return t.vcs.guid === context.vcs.guid;
          });
          vcsModel.checkTokensValidity();
        });
      }
    };

    function _edit(token) {
      console.log('TODO: edit token');
    }

    function _delete(token) {
      console.log('TODO: delete token');
      confirmDialog({
        title: gettext('Delete Personal Access Token'),
        description: gettext('Are you sure you want to delete the') +
        " '" + token.token.name + "' Personal Access Token?",
        buttonText: {
          yes: gettext('Delete'),
          no: gettext('Cancel')
        },
        errorMessage: gettext('Failed to delete Personal Access Token'),
        callback: function () {
          return vcsModel.deleteVcsToken(token.token.guid)
            .then(function () {
              notificationsService.notify('success', gettext('Personal Access Token \'{{ name }}\' successfully deleted'),
                {name: token.token.name});
              // After a successful delete, refresh the list of tokens
              return context.refreshTokens();
            });
        }
      });
    }

    context.isTokenValid = function isTokenValid(token) {
      return !!vcsModel.validTokens[token.token.guid];
    };
    context.actions = tokenActions;
    context.disableAsyncIndicator = true;

    tokenActions.push({
      name: gettext('Rename'),
      execute: function (token) {
        return _edit(token);
      }
    });
    tokenActions.push({
      name: gettext('Delete'),
      execute: function (token) {
        return _delete(token);
      }
    });
    return {
      /**
       * @name manage
       * @description Opens a slide-out to manage VCS tokens
       * @param {object} vcs - the vcs for which to manage tokens
       * @returns {promise}
       */
      manage: function (vcs) {
        context.vcs = vcs;
        return context.refreshTokens().then(function () {

          return asyncTaskDialog(
            {
              title: gettext('Manage GitHub Personal Access Tokens'),
              templateUrl: 'app/view/endpoints/vcs/manage-vcs-tokens.html',
              class: 'detail-view',
              buttonTitles: {
                submit: gettext('Connect Account'),
                cancel: gettext('Done')
              }
            },
            context,
            function () {
              return registerVcsToken.registerToken(vcs).then(function () {
                // Update tokens
                return context.refreshTokens().then(function () {
                  // Keep the dialog open
                  return $q.reject('Keep this dialog open!');
                });
              });
            }
          ).result;
        });
      }
    };
  }

})();
