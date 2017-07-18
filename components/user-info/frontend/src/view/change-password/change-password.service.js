(function () {
  'use strict';

  angular
    .module('user-info')
    .factory('changePasswordService', ChangePasswordService);

  /**
   * @name ChangePasswordService
   * @description Register a service via a slide out
   * @namespace app.view
   * @param {object} $q - the Angular $q service
   * @param {object} $translate - the Angular $translate service
   * @param {app.model.modelManager} modelManager The console model manager service
   * @param {app.utils.appUtilsService} appUtilsService - the console appUtilsService service
   * @param {app.view.appNotificationsService} appNotificationsService The console notification service
   * @param {app.framework.widgets.frameworkDetailView} frameworkDetailView The framework async detail view
   * @param {app.view.endpoints.dashboard.appEndpointsCnsiService} appEndpointsCnsiService - service to support
   *  dashboard with cnsi type endpoints
   * @returns {object} Object containing 'show' function
   */
  function ChangePasswordService($q, $translate, $http, modelManager, appUtilsService, appNotificationsService,
                                      frameworkAsyncTaskDialog) {

    return {

      show: function (user) {

        var data = {
          oldPassword: '',
          newPassword: ''
        };

        var userInfoModel = modelManager.retrieve('user-info.model');

        var changePassword = function () {
          console.log('Change Password');
          console.log(user);
          console.log(data);
          return userInfoModel.changePassword(user.user.id, data.oldPassword, data.newPassword);
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
            user: user,
            data: data
          },
          changePassword
        );
      }
    };
  }

})();
