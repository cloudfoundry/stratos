(function () {
  'use strict';

  angular
    .module('helionFrameworkExamples')
    .directive('longRunningExample', longRunningExample);

  longRunningExample.$inject = [
    'helionFrameworkExamples.basePath'
  ];

  function longRunningExample(path) {
    return {
      controller: LongRunningExampleController,
      controllerAs: 'longRunningExampleCtrl',
      templateUrl: path + 'long-running/long-running-example.html'
    };
  }

  LongRunningExampleController.$inject = [
    '$q',
    '$interval',
    'helion.framework.utils.long-running.service'
  ];

  function LongRunningExampleController($q, $interval, longRunningService) {
    this.$q = $q;
    this.$interval = $interval;
    this.longRunningService = longRunningService;
    this.grade = 1;
    this.graduated = false;
    this.millisecondsInOneYear = 1200; // you can make one year longer or shorter if you want
    this.checkInterval = 100; // each every month
  }

  angular.extend(LongRunningExampleController.prototype, {

    startSchool: function () {
      var that = this;

      var p = this.$interval(function () {
        if (that.grade >= 12) {
          that.$interval.cancel(p);
        } else {
          that.grade += 1;
        }
      }, that.millisecondsInOneYear);

      this.longRunningService(function () {
        return that.$q(function (resolve) {
          resolve({ data: { currentGrade: that.grade } });
        });
      }, this.checkInterval)

        .until(function (response) {
          return response.data.currentGrade >= 12;
        })

        .then(function () {
          that.graduated = true;
        });
    }
  });

})();
