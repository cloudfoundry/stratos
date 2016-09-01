(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .factory('app.view.endpoints.clusters.cluster.cliCommands', CliCommandsFactory);

  CliCommandsFactory.$inject = [
    'helion.framework.widgets.detailView'
  ];

  function CliCommandsFactory(detailView) {

    return {
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
