(function () {
  'use strict';

  angular
    .module('user-info')
    .factory('editUserInfoService', EditUserInfoService);

  /**
   * @name EditUserInfoService
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
  function EditUserInfoService($q, $translate, $http, modelManager, appUtilsService, appNotificationsService,
                                      frameworkAsyncTaskDialog) {

    return {
      show: function (user) {
          console.log(user);

        var data = {
          familyName: '',
          givenName: '',
          email: ''
        };

        var applyEdit = function () {
          console.log('EDIT');
          console.log(user);
          console.log(data);

          var update = {
            id: user.user.id
            //userName: user.user.userName
          };

          if (data.familyName) {
            update.name = update.name || {};
            update.name.familyName = data.familyName;
          }

          if (data.givenName) {
            update.name = update.name || {};
            update.name.givenName = data.givenName;
          }
          
          if (data.emailAddress) {
            var emails = user.user.emails ? _.clone(user.user.emails) : [];
            var e2 = {
              value: data.emailAddress,
              primary: true
            };
            emails.push(e2);
            update.emails = emails;
          }

          console.log(update);


          // Must supply the version number to udpate
          var options = {
            headers: {
              'If-Match': user.user.meta.version
            }
          };

          return $http.patch('/pp/v1/uaa/Users/' + update.id, update, options).then(function (response) {
            console.log('OKAY');
            console.log(response);
          });
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
          applyEdit
        );
      }
    };        
  }

})();
