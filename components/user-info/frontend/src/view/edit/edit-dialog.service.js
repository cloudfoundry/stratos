(function () {
  'use strict';

  angular
    .module('user-info')
    .factory('editUserInfoService', EditUserInfoService);

  /**
   * @name EditUserInfoService
   * @description Edit User Info dialog service
   * @param {object} $q - the Angular $q service
   * @param {object} $translate - the Angular $translate service
   * @param {app.model.modelManager} modelManager The console model manager service
   * @param {app.framework.widgets.frameworkAsyncTaskDialog} frameworkAsyncTaskDialog The framework async task dialog
   * @returns {object} Object containing 'show' function
   */
  function EditUserInfoService($q, $translate, modelManager, frameworkAsyncTaskDialog) {

    return {
      show: function (user) {
        var userInfoModel = modelManager.retrieve('user-info.model');

        var data = {
          familyName: '',
          givenName: '',
          email: ''
        };

        var applyEdit = function () {
          var update = _.clone(user.user);
          var password;

          if (data.familyName) {
            update.name.familyName = data.familyName;
          }

          if (data.givenName) {
            update.name.givenName = data.givenName;
          }

          if (data.emailAddress) {
            update.emails[0].value = data.emailAddress;
            password = data.password;
            if (!password) {
              return $q.reject();
            }
          }
          return userInfoModel.updateUser(update.id, update, user.user.meta.version, password);
        };

        var isFormInvalid = function () {
          var valid = data.familyName || data.givenName || data.emailAddress;
          if (data.emailAddress) {
            valid = valid && data.password;
          }
          return !valid;
        };

        return frameworkAsyncTaskDialog(
          {
            title: 'user-info.edit',
            templateUrl: 'user-info/view/edit/edit-dialog.html',
            submitCommit: true,
            buttonTitles: {
              submit: 'user-info.update'
            },
            class: 'dialog-form',
            dialog: true
          },
          {
            emailAddress: user.user.emails.length > 0 ? user.user.emails[0].value : '',
            user: user,
            data: data
          },
          applyEdit,
          isFormInvalid
        );
      }
    };
  }

})();
