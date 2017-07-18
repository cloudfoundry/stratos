(function () {
  'use strict';

  angular
    .module('user-info', [
      'cloud-foundry',
      'user-info.api',
      'user-info.model'
    ])
    .config(registerRoute)
    .run(registerUserMenu);

  function registerRoute($stateProvider) {
    $stateProvider.state('user-info', {
      url: '/user-info',
      templateUrl: 'user-info/view/user-info.html',
      controller: UserInfoController,
      controllerAs: 'userCtrl'
    });
  }

  function registerUserMenu(modelManager) {
    var userNavModel = modelManager.retrieve('app.model.navigation').user;
    userNavModel.addMenuItem('user-info', 'user-info', 'user-info', 0);
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
  function UserInfoController($location, $stateParams, $state, $scope, $translate, modelManager, appUtilsService, appNotificationsService, editUserInfoService, changePasswordService) {
    var vm = this;
    vm.cnsiGuid = $stateParams.cnsiGuid;
    vm.id = $stateParams.guid;

    vm.instance = undefined;
    vm.showOptions = false;
    vm.showInstanceSelector = false;

    vm.isEnabling = false;
    vm.ready = false;

    vm.userInfoModel = modelManager.retrieve('user-info.model');

    vm.actions = [
      {
        name: 'user-info.edit',
        execute: function () {
          var modal = editUserInfoService.show({
            userInfo: vm.userInfo,
            user: vm.user
          });
          modal.closed.then(function () {
            vm.fetchData();
            appNotificationsService.notify('success', $translate.instant('user-info.edit.success'));
          });
        },
        disabled: false,
        id: 'edit',
        icon: 'edit'
      },
      {
        name: 'user-info.password-change',
        execute: function () {
          changePasswordService.show(vm.user.id).closed.then(function () {
            vm.fetchData();
            appNotificationsService.notify('success', $translate.instant('user-info.password-change.success'));
          })
        },
        disabled: false,
        id: 'change-password',
        icon: 'lock_outline'
      }
    ];

    vm.fetchData = function () {
      vm.userInfoModel.getCurrentUser().then(function (data) {
        console.log(data);
        vm.userInfo = data.userInfo;
        vm.user = data.user;
      });
    };

    appUtilsService.chainStateResolve('cf.applications.application.ssh', $state, init);

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

      vm.fetchData();

      vm.ready = true;
    }

  }
})();
