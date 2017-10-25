(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('stratosUrl', stratosUrl);

  function stratosUrl(appUtilsService) {
    return {
      restrict: 'A',
      require: '?ngModel',
      link: function (scope, elm, attr, ctrl) {
        if (!ctrl) {
          return;
        }
        ctrl.$validators.pattern = function (modelValue, viewValue) {
          return ctrl.$isEmpty(viewValue) || appUtilsService.urlValidationExpression.test(viewValue) || appUtilsService.localUrlValidationExpression.test(viewValue);
        };
      }
    };
  }
})();
