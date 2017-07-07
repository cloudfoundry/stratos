(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('autoUpdate', autoUpdate);

  /**
   * @namespace app.framework.widgets.autoUpdate
   * @memberof app.framework.widgets
   * @name autoUpdate
   * @description Rotating spinner to indicate an update function is running. Update can be stopped/started by clicking
   * on spinner
   * @example
   * vm.run = true;
   * vm.interval = 5000;
   * vm.update = function() {
   *   return $q.resolve();
   * };
   * <auto-update
   *    update="appCtrl.update"
   *    interval="appCtrl.interval"
   *    popover="Click to start or stop"
   *    run="appCtrl.run">
   * </auto-update>
   * @returns {object} the selected result
   */
  function autoUpdate() {
    return {
      bindToController: {
        update: '=',
        interval: '=',
        run: '=?',
        popover: '@?'
      },
      controller: AutoUpdateController,
      controllerAs: 'autoUpdateCtrl',
      require: ['update', 'interval'],
      restrict: 'E',
      scope: {},
      templateUrl: 'framework/widgets/auto-update/auto-update.html'
    };

  }

  /**
   * @namespace app.framework.widgets.AutoUpdateController
   * @memberof app.framework.widgets
   * @name AutoUpdateController
   * @constructor
   * @param {object} $scope - the Angular $scope
   * @param {object} $interval - the Angular $interval
   * @param {object} $q - the Angular $q
   * @property {boolean} updateRunning - true if the update function is running
   * @property {boolean} intervalRunning - true if the update interval is running
   */
  function AutoUpdateController($scope, $interval, $q) {

    var vm = this;

    var scheduledUpdate, scheduleRunningCheck;

    var ANIMATION_DURATION = 1000;

    vm.updateRunning = false;
    vm.intervalRunning = false;

    $scope.$on('$destroy', function () {
      stopUpdate();
      $interval.cancel(scheduleRunningCheck);
    });

    $scope.$watch('autoUpdateCtrl.run', function (newVal) {
      if (newVal) {
        startUpdate();
      } else {
        stopUpdate();
      }
    });

    $scope.$watch('autoUpdateCtrl.updateRunning', function (newVal) {
      if (!newVal || scheduleRunningCheck) {
        return;
      }
      // If the update finishes quickly the spinning animation can look jarring, so artificially spin it for longer
      vm.animate = true;
      scheduleRunningCheck = $interval(function () {
        if (!vm.updateRunning) {
          vm.animate = false;
          $interval.cancel(scheduleRunningCheck);
          scheduleRunningCheck = null;
        }
      }, ANIMATION_DURATION);
    });

    /**
     * @function startUpdate
     * @description start updating
     * @public
     */
    function startUpdate() {
      if (!scheduledUpdate) {
        scheduledUpdate = $interval(function () {
          vm.updateRunning = true;
          var promise = vm.update() || $q.resolve();
          promise.finally(function () {
            vm.updateRunning = false;
          });
        }, vm.interval);
        vm.intervalRunning = true;
      }
    }

    /**
     * @function stopUpdate
     * @description stop updating
     * @public
     */
    function stopUpdate() {
      if (scheduledUpdate) {
        $interval.cancel(scheduledUpdate);
        scheduledUpdate = undefined;
        vm.intervalRunning = false;
      }
    }
  }

})();
