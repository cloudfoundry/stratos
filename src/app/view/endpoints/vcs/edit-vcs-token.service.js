(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.vcs.editVcsToken', EditVcsTokenService);

  EditVcsTokenService.$inject = [
    '$q',
    'helion.framework.widgets.asyncTaskDialog',
    'app.model.modelManager'
  ];

  /**
   * @name EditVcsTokenService
   * @description Edit a VCS token (for now only rename)
   * @param {app.model.modelManager} modelManager The console model manager service
   * @param {helion.framework.widgets.asyncTaskDialog} asyncTaskDialog The framework async detail view
   * @property {function} add Opens slide out containing the edit form
   * @constructor
   */
  function EditVcsTokenService($q, asyncTaskDialog, modelManager) {
    var vcsModel = modelManager.retrieve('cloud-foundry.model.vcs');
    return {
      /**
       * @name editToken
       * @description Opens a slide-out to register a new VCS token
       * @param {object} vcsToken - the VCS token to edit
       * @returns {promise}
       */
      editToken: function (vcsToken) {

        var tokenNames = _.map(_.filter(vcsModel.vcsTokens, function (t) {
          return t.vcs.guid === vcsToken.vcs.guid;
        }), function (t) {
          return t.token.name;
        });

        var context = {
          token: vcsToken,
          tokenNames: tokenNames,
          data: {
            name: vcsToken.token.name
          }
        };

        return asyncTaskDialog(
          {
            title: gettext('Edit a GitHub Personal Access Token'),
            templateUrl: 'app/view/endpoints/vcs/edit-vcs-token.html',
            class: 'detail-view',
            buttonTitles: {
              submit: gettext('Save')
            }
          },
          context,
          function () {
            if (context.data.name === vcsToken.token.name) {
              return $q.resolve(context.data.name);
            }
            return vcsModel.renameVcsToken(vcsToken.token.guid, context.data.name).then(function () {
              return $q.resolve(context.data.name);
            });
          }
        ).result;
      }
    };
  }

})();
