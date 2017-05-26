(function () {
  'use strict';

  angular
  .module('app.framework.utils')
  .directive('autoPopulateInput', autoPopulateInput);

  /**
   * @name autoPopulateInput
   *
   * @description A utility directive to auto-populate one input field's modelValue
   * from the value of another, when that field has not been touched.
   * @returns {object} The auto-populate-inoput directive definition object
   * @example
   * <auto-populate-input from="<form"> from="<src form field name" to="<destination form field name>">
   */
  function autoPopulateInput() {
    return {
      controller: AutoPopulateController,
      controllerAs: 'autoPopulateInputCtrl',
      bindToController: {
        form: '=',
        from: '@',
        to: '@'
      },
      restrict: 'E',
      scope: {}
    };
  }

  /**
   * @memberof app.framework.widgets
   * @namespace app.framework.utils
   * @name AutoPopulateController
   * @description Controller for the auto populate input directice
   * @param {object} $scope - Angular $scope object
   * @constructor
   */
  function AutoPopulateController($scope) {
    if (this.form && this.from && this.to) {
      var srcModel = this.form[this.from];
      var destModel = this.form[this.to];
      if (srcModel && destModel) {
        $scope.$watch(function () {
          return srcModel.$viewValue;
        }, function (value) {
          if (destModel.$untouched || !destModel.$viewValue) {
            destModel.$setUntouched();
            destModel.$setViewValue(value, true);
            destModel.$commitViewValue();
            destModel.$render();
          }
        });
      }
    }
  }
})();
