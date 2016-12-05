(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.vcs.manageVcsTokens', ManageVcsTokensService);

  ManageVcsTokensService.$inject = [
    '$q',
    '$timeout',
    'PAT_DELIMITER',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog',
    'helion.framework.widgets.dialog.confirm',
    'app.view.notificationsService',
    'app.view.vcs.registerVcsToken',
    'app.view.vcs.editVcsToken'
  ];

  /**
   * @name ManageVcsTokensService
   * @description Manage tokens for a VCS
   * @param {object} $q - the Angular $q service
   * @param {object} $timeout - the Angular $timeout service
   * @param {string} PAT_DELIMITER - the delimiter constant used to separate the PAT guid in the project name
   * @param {app.model.modelManager} modelManager The console model manager service
   * @param {helion.framework.widgets.asyncTaskDialog} asyncTaskDialog The framework async detail view
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog The framework confirmation dialog
   * @param {app.view.notificationsService} notificationsService The toasts notifications service
   * @param {app.view.registerVcsToken} registerVcsToken Service to register new VCS tokens
   * @param {app.view.editVcsToken} editVcsToken Service to rename VCS tokens
   * @returns {object} The ManageVcsTokensService with a manage method that opens slide out containing the manage tokens UI
   */
  function ManageVcsTokensService($q, $timeout, PAT_DELIMITER, modelManager, asyncTaskDialog, confirmDialog, notificationsService, registerVcsToken, editVcsToken) {
    var vcsModel = modelManager.retrieve('cloud-foundry.model.vcs');
    var tokenActions = [];
    var context = {
      tokens: []
    };

    // Force Smart Table watch to trigger by updating the context.tokens reference
    context.triggerWatch = function () {
      var savedTokens = _.clone(context.tokens);
      context.tokens = [];
      $timeout(function () {
        context.tokens = savedTokens;
      });
    };

    context.refreshTokens = function (fetchFresh) {
      var oldLength = context.tokens.length;
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
        if (context.tokens.length === oldLength) {
          context.triggerWatch();
        }
        vcsModel.checkTokensValidity();
      });
    };

    function _edit(token) {
      var oldName = token.token.name;
      return editVcsToken.editToken(token).then(function (newName) {
        if (newName === oldName) {
          return;
        }
        notificationsService.notify('success', gettext("Personal Access Token '{{ name }}' successfully renamed to '{{ newName }}'"),
          {
            name: oldName,
            newName: newName
          });
        // After a successful rename, no need to do anything as entry is updated in place
        context.tokens = _.clone(context.tokens);
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
       * @param {string} tokenGuid - if in chooserMode, this is the currently selected token ID
       * @returns {promise}
       */
      manage: function (vcs, chooserMode, tokenGuid) {
        context.vcs = vcs;
        context.chooserMode = chooserMode;
        context.chosenToken = tokenGuid;

        context.registerNewToken = function () {
          return registerVcsToken.registerToken(vcs).then(function () {
            // Update tokens (need to fetch)
            return context.refreshTokens(true);
          });
        };

        var title, submitCommit;
        if (chooserMode) {
          title = 'Choose a GitHub Personal Access Token';
          submitCommit = function () {
            return context.chosenToken !== tokenGuid;
          };
        } else {
          title = 'Manage GitHub Personal Access Tokens';
          submitCommit = false;
        }

        // Refresh before fetching
        return context.refreshTokens(true).then(function () {

          return asyncTaskDialog(
            {
              title: gettext(title),
              templateUrl: 'app/view/endpoints/vcs/manage-vcs-tokens.html',
              class: 'detail-view',
              buttonTitles: {
                submit: gettext('Done')
              },
              noCancel: true,
              submitCommit: submitCommit
            },
            context,
            function (val) {
              if (chooserMode) {
                return $q.resolve(context.chosenToken);
              }
              return $q.resolve(val);
            }
          ).result;
        });
      },

      getPatGuid: function (projectName) {
        if (!projectName) {
          return undefined;
        }
        var delimIndex = projectName.indexOf(PAT_DELIMITER);
        if (delimIndex < 0) {
          return undefined;
        }
        return projectName.slice(delimIndex + PAT_DELIMITER.length);
      },

      updateProjectName: function (oldProjectName, patGuid) {
        var delimIndex = oldProjectName.indexOf(PAT_DELIMITER);
        if (delimIndex < 0) {
          return oldProjectName + PAT_DELIMITER + patGuid;
        } else {
          return oldProjectName.slice(0, delimIndex) + PAT_DELIMITER + patGuid;
        }
      }

    };
  }

})();
