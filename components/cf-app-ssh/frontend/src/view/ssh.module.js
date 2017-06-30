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

  function registerAppTab(cfApplicationTabs, modelManager) {
    cfApplicationTabs.tabs.push({
      position: 8,
      hide: function () {
        var model = modelManager.retrieve('cloud-foundry.model.application');
        return !model.application.summary.enable_ssh;
      },
      uiSref: 'cf.applications.application.ssh',
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
   * @param {object} $scope - the angular $scope service
   */
  function ApplicationSSHController($location, $stateParams, $scope) {
    var vm = this;
    vm.cnsiGuid = $stateParams.cnsiGuid;
    vm.id = $stateParams.guid;

    vm.instance = undefined;
    vm.showOptions = false;
    vm.showInstanceSelector = false;

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
  }

})();
