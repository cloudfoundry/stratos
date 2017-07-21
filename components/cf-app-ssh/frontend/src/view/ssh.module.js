(function () {
  'use strict';

  angular
    .module('cf-app-ssh', ['cloud-foundry'])
    .config(registerRoute)
    .run(registerAppTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.ssh', {
      url: '/ssh',
      templateUrl: 'cf-app-ssh/view/ssh.html',
      controller: ApplicationSSHController,
      controllerAs: 'applicationSSHController'
    });
  }

  function registerAppTab($stateParams, cfApplicationTabs, modelManager, cfUtilsService) {
    cfApplicationTabs.tabs.push({
      position: 8,
      hide: function () {
        var cnsiGuid = $stateParams.cnsiGuid;
        var cnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
        return !cfUtilsService.hasSshAccess(cnsiModel.serviceInstances[cnsiGuid]);
      },
      uiSref: 'cf.applications.application.ssh',
      uiSrefParam: function () {
        return {guid: $stateParams.guid};
      },
      label: 'cf.app-ssh',
      clearState: function () {
      }
    });
  }

  /**
   * @name ApplicationSSHController
   * @constructor
   * @param {object} $location - the Angular $location service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $state - the UI router $state service
   * @param {object} $scope - the angular $scope service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.appUtilsService} appUtilsService - utils service
   */
  function ApplicationSSHController($location, $stateParams, $state, $scope, modelManager, appUtilsService) {
    var vm = this;
    vm.cnsiGuid = $stateParams.cnsiGuid;
    vm.id = $stateParams.guid;

    vm.instance = undefined;
    vm.showOptions = false;
    vm.showInstanceSelector = false;

    vm.isEnabling = false;
    vm.ready = false;

    vm.model = modelManager.retrieve('cloud-foundry.model.application');

    appUtilsService.chainStateResolve('cf.applications.application.ssh', $state, init);

    function init() {
      // Check that the user has permissions to be able to change the SSH status on the space
      var consoleInfo = modelManager.retrieve('app.model.consoleInfo');
      var user = consoleInfo.info.endpoints.cf[vm.cnsiGuid].user;
      var spaceGuid = vm.model.application.space.metadata.guid;
      var organizationGuid = vm.model.application.organization.metadata.guid;
      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      var canUpdate = authModel.isAllowed(vm.cnsiGuid, authModel.resources.space, authModel.actions.update, spaceGuid, organizationGuid);
      vm.canManageSpaceSsh = canUpdate || user.isAdmin;
      vm.canManageAppSsh = authModel.isAllowed(vm.cnsiGuid, authModel.resources.application, authModel.actions.update, spaceGuid);

      vm.ready = true;
    }

    $scope.$watch('applicationSSHController.instance', function (val) {
      if (angular.isDefined(val)) {
        vm.connect(val);
      } else {
        vm.title = 'cf.app-ssh.select-instance';
        vm.instance = undefined;
        vm.showInstanceSelector = true;
      }
    });

    $scope.$watch('applicationSSHController.streaming', function (val) {
      if (val === 3) {
        vm.showOptions = true;
      } else {
        vm.showOptions = false;
      }
    });

    vm.connect = function (id) {
      vm.title = 'cf.app-ssh.instance-title';
      vm.showInstanceSelector = false;
      vm.instance = id;

      var protocol = $location.protocol() === 'https' ? 'wss' : 'ws';
      vm.websocketUrl = protocol + '://' + $location.host() + ':' + $location.port() + '/pp/v1/' +
      $stateParams.cnsiGuid + '/apps/' + $stateParams.guid + '/ssh/' + id;
    };

    vm.selectInstance = function () {
      vm.showOptions = false;
      vm.instance = undefined;
    };

    vm.reconnect = function () {
      vm.showOptions = false;
      vm.connect(vm.instance);
    };

    vm.enable = function () {
      var updatedAppSpec = {
        enable_ssh: true
      };
      vm.isEnabling = true;
      return vm.model.update(vm.cnsiGuid , vm.id, updatedAppSpec).finally(function () {
        vm.isEnabling = false;
      });
    };
  }
})();
