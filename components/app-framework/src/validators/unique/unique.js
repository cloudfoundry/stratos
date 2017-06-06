(function () {
  'use strict';

  angular
    .module('app.framework.validators')
    .directive('stratosUnique', stratosUnique);

  /**
   * @namespace app.framework.validators.stratosUnique
   * @memberof app.framework.validators
   * @name stratosUnique
   * @description A validator to check for uniqueness of the
   * value entered in the input field.
   * @example
   * var servers = [
   *   { name: 'server1' },
   *   { name: 'server2' }
   * ];
   * <form name="testForm">
   *   <input type="text" name="serverName" ng-model="data.serverName"
   *     items="servers" key="'name'" ignore-case stratos-unique/>
   * </form>
   * @returns {object} The stratos-unique directive definition object
   */
  function stratosUnique() {
    return {
      link: link,
      require: 'ngModel',
      restrict: 'A',
      scope: {
        items: '=',
        key: '=?'
      }
    };

    function link(scope, element, attrs, ngModelController) {
      var originalModelValue;
      var items = [];
      var ignoreCase = angular.isDefined(attrs.ignoreCase);

      ngModelController.$validators.stratosUnique = validator;
      scope.$watchCollection('items', update);

      update();

      function update() {
        items = scope.items || [];

        if (scope.key) {
          items = _.map(items, scope.key);
        }

        if (ignoreCase) {
          items = _.map(items, _.toLower);
        }

        ngModelController.$validate();
      }

      function validator(modelValue, viewValue) {
        if (ngModelController.$pristine) {
          originalModelValue = modelValue;
        }
        var valueToCheck = ignoreCase ? _.toLower(viewValue) : viewValue;
        return originalModelValue === modelValue ||
          items.indexOf(valueToCheck) === -1;
      }
    }
  }

})();
