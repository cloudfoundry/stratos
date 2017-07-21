(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster')
    .factory('appClusterCliCommands', CliCommandsFactory);

  /**
   * @memberof cloud-foundry.view.dashboard.cluster
   * @name CliCommandsFactory
   * @description Factory to provide a way to show the cli commands for CF
   * @constructor
   * @param {app.model.modelManager} modelManager - The console's modelManager service
   * @param {app.framework.widgets.frameworkDetailView} frameworkDetailView - The console's frameworkDetailView service
   */
  function CliCommandsFactory(modelManager, frameworkDetailView) {

    var authModel = modelManager.retrieve('cloud-foundry.model.auth');
    var consoleInfo = modelManager.retrieve('app.model.consoleInfo');

    return {
      /**
       * @function show
       * @memberof cloud-foundry.view.dashboard.cluster
       * @description Show a detail view containing basic cli instructions
       * @param {string=} api - The api url used to connect the CF cli tool to the required CF
       * @param {string=} username - Username used to connect to CF
       * @param {string=} clusterGuid - Target cluster guid
       * @param {string=} organization - Target organization
       * @param {string=} space - Target space
       * @returns {promise} A detail view promise
       * @public
       */
      show: function (api, username, clusterGuid, organization, space) {
        var user = consoleInfo.info.endpoints.cf[clusterGuid].user;
        var isAdmin = user.admin;

        var canUpdateOrg = organization ? authModel.isAllowed(clusterGuid,
          authModel.resources.organization, authModel.actions.update, organization.details.org.metadata.guid)
          : isAdmin;
        var canUpdateSpace = space ? authModel.isAllowed(clusterGuid, authModel.resources.space,
          authModel.actions.update, space.details.space.metadata.guid, organization.details.org.metadata.guid)
          : isAdmin;

        return frameworkDetailView(
          {
            templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/actions/cli-commands/cli-commands.html',
            title: 'cf.summary.panel.cli-dialog-cluster.title',
            dialog: true,
            class: 'cluster-cli-commands'
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
