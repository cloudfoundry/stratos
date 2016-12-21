(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.notification-target', [])
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
      templateUrl: 'plugins/cloud-foundry/view/applications/' +
      'application/notification-targets/notification-target.html'
    };
  }

  NotificationTargetController.$inject = [
    '$scope',
    'app.api.apiManager',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  /**
   * @constructor
   * @name NotificationTargetController
   * @description Notification target controller
   * @memberOf cloud-foundry.view.applications.application.notification-target
   * @param {object} $scope - angular $scope
   * @param {app.api.apiManager} apiManager - the API management service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {helion.framework.widgets.asyncTaskDialog} asyncTaskDialog - Async Task Dialog service
   */
  function NotificationTargetController($scope, apiManager, modelManager, asyncTaskDialog) {
    this.$scope = $scope;
    this.asyncTaskDialog = asyncTaskDialog;
    this.hceNotificationApi = apiManager.retrieve('cloud-foundry.api.HceNotificationApi');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');

  }

  angular.extend(NotificationTargetController.prototype, {

    /**
     * @name addTarget
     * @memberOf cloud-foundry.view.applications.application.notification-target
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

      return this.asyncTaskDialog(
        {
          title: this.targetType.title,
          templateUrl: 'plugins/cloud-foundry/view/applications/workflows/' +
            'add-app-workflow/pipeline-subflow/add-notification-dialog.html',
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
     * @memberOf cloud-foundry.view.applications.application.notification-target
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
