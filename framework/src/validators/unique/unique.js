(function () {
  'use strict';

  angular
    .module('helion.framework.validators')
    .directive('helionUnique', helionUnique);

  /**
   * @namespace helion.framework.validators.helionUnique
   * @memberof helion.framework.validators
   * @name helionUnique
   * @description A validator to check for uniqueness of the
   * value entered in the input field.
   * @example
   * var servers = [
   *   { name: 'server1' },
   *   { name: 'server2' }
   * ];
   * <form name="testForm">
   *   <input type="text" name="serverName" ng-model="data.serverName"
   *     items="servers" key="'name'" ignore-case helion-unique/>
   * </form>
   * @returns {object} The helion-unique directive definition object
   */
  function helionUnique() {
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
      var items = [];
      var ignoreCase = angular.isDefined(attrs.ignoreCase);

      ngModelController.$validators.helionUnique = validator;
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
        var valueToCheck = ignoreCase ? _.toLower(viewValue) : viewValue;
        return items.indexOf(valueToCheck) === -1;
      }
    }
  }

})();
