(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.log-stream',
    ['cloud-foundry.view.applications.application.log-stream.cfLogViewer'])
    .config(registerRoute)
    .run(registerAppTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.log-stream', {
      url: '/log-stream',
      template: '<cf-log-viewer web-socket-url="applicationLogStreamCtrl.webSocketUrl"/>',
      controller: ApplicationLogStreamController,
      controllerAs: 'applicationLogStreamCtrl'
    });
  }

  function registerAppTab($stateParams, cfApplicationTabs) {
    cfApplicationTabs.tabs.push({
      position: 2,
      hide: false,
      uiSref: 'cf.applications.application.log-stream',
      uiSrefParam: function () {
        return {guid: $stateParams.guid};
      },
      label: 'app.app-info.app-tabs.log-stream.label'
    });
  }

  /**
   * @name ApplicationLogStreamController
   * @constructor
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $location - the Angular $location service
   */
  function ApplicationLogStreamController($stateParams, $location) {
    var vm = this;

    var protocol = $location.protocol() === 'https' ? 'wss' : 'ws';
    vm.webSocketUrl = protocol + '://' + $location.host() + ':' + $location.port() + '/pp/v1/' +
      $stateParams.cnsiGuid + '/apps/' + $stateParams.guid + '/stream';

    // Comment this out to test log stream in gulp dev
    // vm.websocketUrl = protocol + '://' + $location.host() + ':3003/v1/' + $stateParams.cnsiGuid + '/apps/' + $stateParams.guid + '/stream';
  }

})();
