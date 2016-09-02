(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .factory('app.view.endpoints.clusters.cluster.cliCommands', CliCommandsFactory);

  CliCommandsFactory.$inject = [
    'helion.framework.widgets.detailView'
  ];

  /**
   * @memberof app.view.endpoints.clusters.cluster
   * @name CliCommandsFactory
   * @description Factory to provide a way to show the cli commands for HCF
   * @constructor
   * @param {helion.framework.widgets.detailView} detailView - The console's detailView service
   */
  function CliCommandsFactory(detailView) {

    return {
      /**
       * @function show
       * @memberof app.view.endpoints.clusters.cluster
       * @description Show a detail view containing basic cli instructions
       * @param {string=} api - The api url used to connect the HCF cli tool to the required HCF
       * @param {string=} username - Username used to connect to HCF
       * @param {string=} orgName - Target organization's name
       * @param {string=} spaceName - Target space name
       * @returns {promise} A detail view promise
       * @public
       */
      show: function (api, username, orgName, spaceName) {
        return detailView(
          {
            templateUrl: 'app/view/endpoints/clusters/cluster/actions/cli-commands/cli-commands.html',
            title: gettext('CLI Commands')
          },
          {
            api: api,
            orgName: orgName,
            spaceName: spaceName,
            username: username
          }
        );
      }
    };
  }

})();
