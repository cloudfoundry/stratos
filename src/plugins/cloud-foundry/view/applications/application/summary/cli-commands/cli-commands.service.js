(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary')
    .factory('cloud-foundry.view.applications.application.summary.cliCommands', CliCommandsFactory);

  CliCommandsFactory.$inject = [
    'helion.framework.widgets.detailView',
    'app.utils.utilsService'
  ];

  /**
   * @memberof cloud-foundry.view.applications.application.summary
   * @name CliCommandsFactory
   * @description Factory to provide a way to show the cli commands for App Summary
   * @constructor
   * @param {helion.framework.widgets.detailView} detailView - The console's detailView service
   * @param {object} utils - Utils service
   */
  function CliCommandsFactory(detailView, utils) {

    return {
      /**
       * @function show
       * @memberof app.view.endpoints.clusters.cluster
       * @description Show a detail view containing basic cli instructions
       * @param {object} appModel - Application model
       * @param {string} username - Username used to connect to HCF
       * @returns {promise} A detail view promise
       * @public
       */
      show: function (appModel, username) {
        return detailView(
          {
            templateUrl: 'plugins/cloud-foundry/view/applications/application/summary/cli-commands/cli-commands.html',
            title: gettext('CLI Commands')
          },
          {
            apiEndpoint: utils.getClusterEndpoint(appModel.cluster),
            orgName: appModel.organization.name,
            spaceName: appModel.space.name,
            appName: appModel.summary.name,
            username: username
          }
        );
      }
    };
  }

})();
