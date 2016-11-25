(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.editVcsToken', EditVcsTokenService);

  EditVcsTokenService.$inject = [
    '$q',
    'helion.framework.widgets.asyncTaskDialog',
    'app.model.modelManager'
  ];

  /**
   * @name RegisterVcsTokenService
   * @description Register token for a VCS
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager The console model manager service
   * @param {helion.framework.widgets.asyncTaskDialog} asyncTaskDialog The framework async detail view
   * @property {function} add Opens slide out containing registration form
   * @constructor
   */
  function EditVcsTokenService($q, asyncTaskDialog, modelManager) {

    return {
      /**
       * @name editToken
       * @description Opens a slide-out to register a new VCS token
       * @param {object} vcs - the vcs for which to register a new token
       * @returns {promise}
       */
      editToken: function (vcsToken) {
        var tokenPattern;
        if (vcsToken.vcs.vcs_type === 'github') {
          tokenPattern = /[0-9a-f]{40}/;
        }
        var context = {
          token: vcsToken,
          tokenPattern: tokenPattern
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
            console.log('TODO: Save token');
            return $q.resolve();
          }
        ).result;
      }
    };
  }

})();
