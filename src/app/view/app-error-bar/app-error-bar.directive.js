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
    'appEventEventService'
  ];

  /**
   * @name AppErrorBarController
   * @memberof app.view
   * @description Controller for the Application Error Bar directive
   * @constructor
   * @param {object} $scope - the Angular $scope
   * @param {appEventEventService} appEventEventService - the event Service
   * @property {appEventEventService} appEventEventService - the event Service
   * @property {string} messgae - the error message to display
   */
  function AppErrorBarController($scope, appEventEventService) {
    var that = this;
    this.appEventEventService = appEventEventService;
    this.message = undefined;
    this.displayed = false;

    this.removeSetListener = appEventEventService.$on(appEventEventService.events.APP_ERROR_NOTIFY, function (ev, msg) {
      that.message = msg;
      that.displayed = true;
    });

    this.removeClearListener = appEventEventService.$on(appEventEventService.events.APP_ERROR_CLEAR, function () {
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
