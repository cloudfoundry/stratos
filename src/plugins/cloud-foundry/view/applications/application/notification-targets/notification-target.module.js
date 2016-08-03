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
        userInputTargetType: '=',
        addAppMode: '=?'
      },
      controller: NotificationTargetController,
      controllerAs: 'notificationTargetCtrl',
      scope: {},
      restrict: 'E',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/notification-targets/notification-target.html'
    };
  }

  NotificationTargetController.$inject = [
    '$scope'
  ];

  function NotificationTargetController() {
  }
})();
