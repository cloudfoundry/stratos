(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('jsonTextInput', jsonTextInput);

  /**
   * @name jsonTextInput
   * @description A directive that displays JSON.
   * @returns {object} The directive definition object
   */
  function jsonTextInput() {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        ngModel: '='
      },
      link: function ($scope, elem, attr, ngModelCtrl) {
        ngModelCtrl.$parsers.push(function (viewValue) {
          try {
            return angular.fromJson(viewValue);
          } catch (e) {
            return undefined;
          }
        });
        ngModelCtrl.$formatters.push(function (value) {
          return angular.toJson(value, 2);
        });
      }
    };
  }
})();
