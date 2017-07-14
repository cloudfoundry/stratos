(function () {
  'use strict';

  angular
    .module('user-info', ['cloud-foundry'])
    .config(registerRoute)
    .run(registerAppTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('user-info', {
      url: '/user-info',
      templateUrl: 'user-info/view/user-info.html',
      controller: UserInfoController,
      controllerAs: 'userInfoController'
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
      label: 'cf.app-ssh',
      clearState: function () {
      }
    });
  }

  /**
   * @name UserInfoController
   * @constructor
   * @param {object} $location - the Angular $location service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $state - the UI router $state service
   * @param {object} $scope - the angular $scope service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.appUtilsService} appUtilsService - utils service
   */
  function UserInfoController($location, $stateParams, $state, $scope, modelManager, appUtilsService, $http) {
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

    // Testing
    $http.get('/pp/v1/uaa/userinfo').then(function (response) {
      console.log('Made request to UAA backend');
      console.log(response);

      var userId = response.data.user_id;
      console.log(userId);

      $http.get('/pp/v1/uaa/Users/' + userId).then(function (response) {
        console.log('Got User info');
        console.log(response);
      });
      
    });

    function init() {
      // // Check that the user has permissions to be able to change the SSH status on the space
      // var consoleInfo = modelManager.retrieve('app.model.consoleInfo');
      // var user = consoleInfo.info.endpoints.cf[vm.cnsiGuid].user;
      // var spaceGuid = vm.model.application.space.metadata.guid;
      // var organizationGuid = vm.model.application.organization.metadata.guid;
      // var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      // var canUpdate = authModel.isAllowed(vm.cnsiGuid, authModel.resources.space, authModel.actions.update, spaceGuid, organizationGuid);
      // vm.canManageSpaceSsh = canUpdate || user.isAdmin;
      // vm.canManageAppSsh = authModel.isAllowed(vm.cnsiGuid, authModel.resources.application, authModel.actions.update, spaceGuid);

      vm.ready = true;
    }

  }
})();
