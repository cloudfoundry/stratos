(function () {
  'use strict';

  angular
    .module('code-engine.view.application.notification-target', [])
    .directive('notificationTarget', notificationTarget);

  notificationTarget.$inject = [];

  function notificationTarget() {
    return {
      bindToController: {
        targetType: '=',
        addAppMode: '=?',
        userInput: '='
      },
      controller: NotificationTargetController,
      controllerAs: 'notificationTargetCtrl',
      scope: {},
      restrict: 'E',
      templateUrl: 'plugins/code-engine/view/application/notification-targets/notification-target.html'
    };
  }

  NotificationTargetController.$inject = [
    '$scope',
    'apiManager',
    'modelManager',
    'frameworkAsyncTaskDialog'
  ];

  /**
   * @constructor
   * @name NotificationTargetController
   * @description Notification target controller
   * @memberOf code-engine.view.application.notification-target
   * @param {object} $scope - angular $scope
   * @param {app.api.apiManager} apiManager - the API management service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {helion.framework.widgets.frameworkAsyncTaskDialog} frameworkAsyncTaskDialog - Async Task Dialog service
   */
  function NotificationTargetController($scope, apiManager, modelManager, frameworkAsyncTaskDialog) {
    this.$scope = $scope;
    this.frameworkAsyncTaskDialog = frameworkAsyncTaskDialog;
    this.hceNotificationApi = apiManager.retrieve('code-engine.api.HceNotificationApi');
    this.hceModel = modelManager.retrieve('code-engine.model.hce');

  }

  angular.extend(NotificationTargetController.prototype, {

    /**
     * @name addTarget
     * @memberOf code-engine.view.application.notification-target
     * @description Add new target to project
     * @returns {promise}
     */
    addTarget: function () {

      var that = this;
      var addNotificationTarget = function (data) {
        data.type = that.targetType.item_value;
        return that.hceNotificationApi.addNotificationTarget(that.userInput.hceCnsi.guid,
          data, {project_id: that.userInput.projectId}, that.hceModel.hceProxyPassthroughConfig)
          .then(function () {
            return that.hceModel.getNotificationTargets(that.userInput.hceCnsi.guid, that.userInput.projectId);
          })
          .then(function (response) {
            that.userInput.notificationTargets = response.data;
          });
      };

      var data = {
        name: null,
        location: null,
        token: null
      };

      return this.frameworkAsyncTaskDialog(
        {
          title: this.targetType.title,
          templateUrl: 'plugins/code-engine/view/application/add-notification-workflow/add-notification-dialog.html',
          submitCommit: true,
          buttonTitles: {
            submit: gettext('Add notification'),
            cancel: gettext('Back to notifications')
          }
        },
        {
          data: data,
          targetType: this.targetType
        },
        addNotificationTarget
      );
    },

    /**
     * @name getCountForType
     * @memberOf code-engine.view.application.notification-target
     * @description Get count
     * @returns {number}
     */
    getCountForType: function () {

      var that = this;
      var filteredArray = [];
      if (this.userInput.notificationTargets && this.userInput.notificationTargets.length > 0) {
        filteredArray = _.filter(this.userInput.notificationTargets, function (notificationTarget) {
          return notificationTarget.type === that.targetType.item_value;
        });
      }
      return filteredArray.length;
    }

  });
})();
