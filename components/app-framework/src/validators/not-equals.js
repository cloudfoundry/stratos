(function () {
  'use strict';

  angular
    .module('app.framework.validators')
    .directive('stratosNotEquals', stratosNotEquals);

  /**
   * @namespace app.framework.validators.stratosNotEquals
   * @memberof app.framework.validators
   * @name stratosNotEquals
   * @description A validator to check a value is different from another.
   * @returns {object} The stratos-not-equals directive definition object
   */
  function stratosNotEquals() {
    return {
      link: link,
      require: 'ngModel',
      restrict: 'A'
    };

    function link(scope, element, attrs, ngModelController) {
      attrs.$observe('stratosNotEquals', function () {
        ngModelController.$validate();
      });

      ngModelController.$validators.stratosNotEquals = validator;

      function validator(modelValue) {
        var otherValue = attrs.stratosNotEquals;
        return modelValue !== otherValue;
      }
    }
  }

})();
