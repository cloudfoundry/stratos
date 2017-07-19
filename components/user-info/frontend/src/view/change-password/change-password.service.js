(function () {
  'use strict';

  angular
    .module('user-info')
    .factory('changePasswordService', ChangePasswordService);

  /**
   * @name ChangePasswordService
   * @description User info change password service
   * @param {object} $translate - the Angular $translate service
   * @param {app.model.modelManager} modelManager The console model manager service
   * @param {app.view.appNotificationsService} appNotificationsService The console notification service
   * @param {app.framework.widgets.frameworkAsyncTaskDialog} frameworkAsyncTaskDialog The framework async task dialog
   * @returns {object} Object containing 'show' function
   */
  function ChangePasswordService($translate, modelManager, appNotificationsService, frameworkAsyncTaskDialog) {
    return {

      // Show the password change dialog
      show: function (userId) {
        var data = {
          oldPassword: '',
          newPassword: '',
          newPasswordConfirm: ''
        };

        var userInfoModel = modelManager.retrieve('user-info.model');

        // Change the password
        var changePassword = function () {
          return userInfoModel.changePassword(userId, data.oldPassword, data.newPassword);
        };

        return frameworkAsyncTaskDialog(
          {
            title: 'user-info.password-change',
            templateUrl: 'user-info/view/change-password/change-password-dialog.html',
            submitCommit: true,
            buttonTitles: {
              submit: 'user-info.password-change.change'
            },
            class: 'dialog-form',
            dialog: true
          },
          {
            data: data
          },
          changePassword
        );
      }
    };
  }
})();
