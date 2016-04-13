(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.workspaces', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.workspaces', {
      url: '/workspaces',
      templateUrl: 'plugins/cloud-foundry/view/workspaces/workspaces.html',
      controller: WorkspacesController,
      controllerAs: 'workspacesCtrl'
    });
  }

  WorkspacesController.$inject = [];

  function WorkspacesController() {
    this.selectedWorkspace = null;
    this.options = [
      { label: 'Workspace One', value: 'one' },
      { label: 'Workspace Two', value: 'two' },
      { label: 'Workspace Three', value: 'three' },
      { label: 'Disabled Workspace', value: 'disabled', disabled: true }
    ];
  }

})();
