(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.registerVcsToken', RegisterVcsTokenService);

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
   * @param {app.model.modelManager} modelManager The console model manager service
   * @param {helion.framework.widgets.asyncTaskDialog} asyncTaskDialog The framework async detail view
   * @property {function} add Opens slide out containing registration form
   * @constructor
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
        var context = {
          vcs: vcs,
          description: gettext('<p>To connect to the ' +
            vcs.label + ', register a <a href="' + vcs.browse_url + '/settings/tokens" target="_blank">Personal Access Token</a>.</p>' +
            '<p>Choose a name to help you identify the Token later on as the full token value will not be visible once you close this form.</p>'),
          tokenPattern: tokenPattern
        };

        return asyncTaskDialog(
          {
            title: gettext('Register a GitHub Personal Access Token'),
            templateUrl: 'app/view/endpoints/vcs/register-vcs-token.html',
            class: 'detail-view',
            buttonTitles: {
              submit: gettext('Register Token')
            }
          },
          context,
          function (data) {
            console.log('Create with data', data);
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
