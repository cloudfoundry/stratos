(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.vcs.manageVcsTokens', ManageVcsTokensService);

  ManageVcsTokensService.$inject = [
    '$q',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog',
    'helion.framework.widgets.dialog.confirm',
    'app.view.notificationsService',
    'app.view.vcs.registerVcsToken',
    'app.view.vcs.editVcsToken',
    '$timeout'
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
  function ManageVcsTokensService($q, modelManager, asyncTaskDialog, confirmDialog, notificationsService, registerVcsToken, editVcsToken, $timeout) {
    var vcsModel = modelManager.retrieve('cloud-foundry.model.vcs');
    var tokenActions = [];
    var context = {
      tokens: []
    };

    // Force Smart Table watch to trigger by updating the context.tokens reference
    context.triggerWatch = function () {
      context.tokens = _.clone(context.tokens);
    };

    context.refreshTokens = function (fetchFresh) {
      var promise;
      if (fetchFresh) {
        promise = vcsModel.listVcsTokens();
      } else {
        promise = $q.resolve(vcsModel.vcsTokens);
      }
      return promise.then(function (tokens) {
        context.tokens = _.filter(tokens, function (t) {
          return t.vcs.guid === context.vcs.guid;
        });
        vcsModel.checkTokensValidity();
      });
    };

    function _edit(token) {
      return editVcsToken.editToken(token).then(function (newName) {
        if (newName === token.token.name) {
          return;
        }
        notificationsService.notify('success', gettext("Personal Access Token '{{ name }}' successfully renamed to '{{ newName }}'"),
          {
            name: token.token.name,
            newName: newName
          });
        // After a successful rename, no need to do anything as entry is updated in place
        context.triggerWatch();
      });
    }

    function _delete(token) {
      return confirmDialog({
        title: gettext('Delete Personal Access Token'),
        description: gettext('Are you sure you want to delete the') +
        " '" + token.token.name + "' Personal Access Token?",
        buttonText: {
          yes: gettext('Delete'),
          no: gettext('Cancel')
        },
        errorMessage: gettext('Failed to delete Personal Access Token'),
        submitCommit: true,
        callback: function () {
          return vcsModel.deleteVcsToken(token.token.guid)
            .then(function () {
              notificationsService.notify('success', gettext('Personal Access Token \'{{ name }}\' successfully deleted'),
                {name: token.token.name});
              // After a successful delete, no need to fetch as the cache is updated
              return context.refreshTokens(false);
            });
        }
      });
    }

    context.isTokenValid = function (token) {
      token.valid = vcsModel.invalidTokens[token.token.guid];
      return !vcsModel.invalidTokens[token.token.guid];
    };

    context.invalidReason = function (token) {
      return vcsModel.invalidTokens[token.token.guid] || '';
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
       * @param {boolean} chooserMode - whether the manager is in chooser mode (with radio buttons to select a token)
       * @returns {promise}
       */
      manage: function (vcs, chooserMode, tokenGuid) {
        context.vcs = vcs;
        context.chooserMode = chooserMode;
        context.chosenToken = tokenGuid;

        context.registerNewToken = function () {
          return registerVcsToken.registerToken(vcs).then(function () {
            // Update tokens (need to fetch)
            return context.refreshTokens(true).then(function () {
              // Keep the dialog open
              return $q.reject('Keep this dialog open!');
            });
          });
        };

        var title, cancelText;
        cancelText = 'Done';
        if (chooserMode) {
          title = 'Choose a GitHub Personal Access Token';
          context.invalidityCheck = function () {
            return !context.chosenToken;
          };
        } else {
          title = 'Manage GitHub Personal Access Tokens';
        }

        // Refresh before fetching
        return context.refreshTokens(true).then(function () {

          return asyncTaskDialog(
            {
              title: gettext(title),
              templateUrl: 'app/view/endpoints/vcs/manage-vcs-tokens.html',
              class: 'detail-view',
              buttonTitles: {
                cancel: gettext(cancelText)
              },
              noSubmit: true
            },
            context
          ).result;
        });
      }
    };
  }

})();
