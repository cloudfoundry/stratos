(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.vcs.registerVcsToken', RegisterVcsTokenService);

  RegisterVcsTokenService.$inject = [
    '$q',
    'helion.framework.widgets.asyncTaskDialog',
    'app.view.notificationsService',
    'app.model.modelManager'
  ];

  /**
   * @name RegisterVcsTokenService
   * @description Register token for a VCS
   * @param {object} $q - the Angular $q service
   * @param {helion.framework.widgets.asyncTaskDialog} asyncTaskDialog The framework async detail view
   * @param {app.view.notificationsService} notificationsService - the Console toast notification service
   * @param {app.model.modelManager} modelManager The console model manager service
   * @returns {object} The RegisterVcsTokenService with an registerToken method that opens slide out containing the register form
   */
  function RegisterVcsTokenService($q, asyncTaskDialog, notificationsService, modelManager) {

    var vcsModel = modelManager.retrieve('cloud-foundry.model.vcs');

    return {
      /**
       * @name registerToken
       * @description Opens a slide-out to register a new VCS token
       * @param {object} vcs - the vcs for which to register a new token
       * @returns {promise}
       */
      registerToken: function (vcs) {
        var tokenPattern;
        if (vcs.vcs_type === 'github') {
          tokenPattern = /[0-9a-f]{40}/;
        }
        var tokenNames = _.map(_.filter(vcsModel.vcsTokens, function (t) {
          return t.vcs.guid === vcs.guid;
        }), function (t) {
          return t.token.name;
        });
        var context = {
          vcs: vcs,
          tokenPattern: tokenPattern,
          tokenNames: tokenNames
        };

        return asyncTaskDialog(
          {
            title: gettext('Register a GitHub Personal Access Token'),
            templateUrl: 'app/view/endpoints/vcs/register-vcs-token.html',
            class: 'detail-view',
            buttonTitles: {
              submit: gettext('Register Token')
            },
            submitCommit: true
          },
          context,
          function (data) {
            return vcsModel.registerVcsToken(vcs.guid, data.name, data.value)
              .then(function () {
                notificationsService.notify('success', gettext('Personal Access Token \'{{ name }}\' successfully registered'),
                  {name:  data.name});
              }, function (res) {
                if (res.status < 500) {
                  context.errorMsg = res.data;
                }
                return $q.reject(res);
              });
          }
        ).result;
      }
    };
  }

})();
