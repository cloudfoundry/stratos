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
   * @constructor
   * @param {object} $translate - the Angular $translate service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} appNotificationsService - the notification  service
   * @param {object} editUserInfoService - the edit user dialgo service
   * @param {object} changePasswordService - the change password dialog service
   */
  function UserInfoController($translate, modelManager, appNotificationsService, editUserInfoService, changePasswordService) {
    var vm = this;
    vm.ready = false;
    vm.userInfoModel = modelManager.retrieve('user-info.model');

    // Toolbar actions
    vm.actions = [
      {
        name: 'user-info.edit',
        execute: function () {
          var modal = editUserInfoService.show({
            userInfo: vm.userInfo,
            user: vm.user
          });
          modal.result.then(function () {
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
          changePasswordService.show(vm.user.id).result.then(function () {
            vm.fetchData();
            appNotificationsService.notify('success', $translate.instant('user-info.password-change.success'));
          });
        },
        disabled: false,
        id: 'change-password',
        icon: 'lock_outline'
      }
    ];

    vm.fetchData = function () {
      return vm.userInfoModel.getCurrentUser().then(function (data) {
        vm.userInfo = data.userInfo;
        vm.user = data.user;
      });
    };

    vm.fetchData().finally(function () {
      vm.ready = true;
    });
  }
})();
