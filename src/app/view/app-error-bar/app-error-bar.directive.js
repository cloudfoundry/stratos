(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('appErrorBar', appErrorBar);

  /**
   * @namespace app.view.clusterRegistration
   * @memberof app.view
   * @name clusterRegistration
   * @description A cluster-registration directive
   * @param {string} appBasePath - the application base path
   * @returns {object} The cluster-registration directive definition object
   */
  function appErrorBar(appBasePath) {
    return {
      bindToController: {
        displayed: '='
      },
      controller: AppErrorBarController,
      controllerAs: 'appErrorBarCtrl',
      templateUrl: appBasePath + 'view/app-error-bar/app-error-bar.html',
      scope: {}
    };
  }

  /**
   * @name AppErrorBarController
   * @memberof app.view
   * @description Controller for the Application Error Bar directive
   * @constructor
   * @param {object} $scope - the Angular $scope
   * @param {app.utils.appEventService} appEventService - the event Service
   * @param {object} $translate - the i18n $translate service
   */
  function AppErrorBarController($scope, appEventService, $translate) {
    var that = this;
    this.appEventService = appEventService;
    this.message = undefined;
    this.displayed = false;

    this.removeSetListener = appEventService.$on(appEventService.events.APP_ERROR_NOTIFY, function (ev, msg) {
      that.message = $translate.instant(msg);
      that.displayed = true;
    });

    this.removeClearListener = appEventService.$on(appEventService.events.APP_ERROR_CLEAR, function () {
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
