(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .factory('app.view.endpoints.clusters.cluster.cliCommands', CliCommandsFactory);

  CliCommandsFactory.$inject = [
    'modelManager',
    'helion.framework.widgets.detailView'
  ];

  /**
   * @memberof app.view.endpoints.clusters.cluster
   * @name CliCommandsFactory
   * @description Factory to provide a way to show the cli commands for HCF
   * @constructor
   * @param {app.model.modelManager} modelManager - The console's modelManager service
   * @param {helion.framework.widgets.detailView} detailView - The console's detailView service
   */
  function CliCommandsFactory(modelManager, detailView) {

    var authModel = modelManager.retrieve('cloud-foundry.model.auth');
    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    return {
      /**
       * @function show
       * @memberof app.view.endpoints.clusters.cluster
       * @description Show a detail view containing basic cli instructions
       * @param {string=} api - The api url used to connect the HCF cli tool to the required HCF
       * @param {string=} username - Username used to connect to HCF
       * @param {string=} clusterGuid - Target cluster guid
       * @param {string=} organization - Target organization
       * @param {string=} space - Target space
       * @returns {promise} A detail view promise
       * @public
       */
      show: function (api, username, clusterGuid, organization, space) {
        var user = stackatoInfo.info.endpoints.hcf[clusterGuid].user;
        var isAdmin = user.admin;

        var canUpdateOrg = organization ? authModel.isAllowed(clusterGuid,
          authModel.resources.organization, authModel.actions.update, organization.details.org.metadata.guid)
          : isAdmin;
        var canUpdateSpace = space ? authModel.isAllowed(clusterGuid, authModel.resources.space,
          authModel.actions.update, space.details.space.metadata.guid, organization.details.org.metadata.guid)
          : isAdmin;

        return detailView(
          {
            templateUrl: 'app/view/endpoints/clusters/cluster/actions/cli-commands/cli-commands.html',
            title: gettext('CLI Commands')
          },
          {
            api: api,
            orgName: _.get(organization, 'details.org.entity.name'),
            spaceName: _.get(space, 'details.space.entity.name'),
            username: username,
            canUpdateOrg: canUpdateOrg,
            canUpdateSpace: canUpdateSpace
          }
        );
      }
    };
  }

})();
