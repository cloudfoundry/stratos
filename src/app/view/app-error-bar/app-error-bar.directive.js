(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('appErrorBar', appErrorBar);

  appErrorBar.$inject = ['app.basePath'];

  /**
   * @namespace app.view.clusterRegistration
   * @memberof app.view
   * @name clusterRegistration
   * @description A cluster-registration directive
   * @param {string} path - the application base path
   * @returns {object} The cluster-registration directive definition object
   */
  function appErrorBar(path) {
    return {
      bindToController: {
        displayed: '='
      },
      controller: AppErrorBarController,
      controllerAs: 'appErrorBarCtrl',
      templateUrl: path + 'view/app-error-bar/app-error-bar.html',
      scope: {}
    };
  }

  AppErrorBarController.$inject = [
    '$scope',
    'app.event.eventService',
    '$translate'
  ];

  /**
   * @name AppErrorBarController
   * @memberof app.view
   * @description Controller for the Application Error Bar directive
   * @constructor
   * @param {object} $scope - the Angular $scope
   * @param {app.event.eventService} eventService - the event Service
   * @param {object} $translate - the i18n $translate service
   * @property {app.event.eventService} eventService - the event Service
   * @property {string} messgae - the error message to display
   */
  function AppErrorBarController($scope, eventService, $translate) {
    var that = this;
    this.eventService = eventService;
    this.message = undefined;
    this.displayed = false;

    this.removeSetListener = eventService.$on(eventService.events.APP_ERROR_NOTIFY, function (ev, msg) {
      that.message = $translate.instant(msg);
      that.displayed = true;
    });

    this.removeClearListener = eventService.$on(eventService.events.APP_ERROR_CLEAR, function () {
      that.displayed = false;
      that.message = undefined;
    });

    $scope.$on('$destroy', function () {
      that.removeSetListener();
      delete that.removeSetListener;
      that.removeClearListener();
      delete that.removeClearListener;
    });
  }
})();
