(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .directive('selectedUsersValidator', selectedUsers);

  /**
   * @namespace app.view.endpoints.clusters.cluster
   * @memberof app.view.endpoints.clusters.cluster.selectedUsersValidator
   * @name selected-users-validator
   * @description A validator that checks an object for properties who's values are truthies
   */
  function selectedUsers() {
    return {
      link: link,
      require: 'ngModel',
      restrict: 'A'
    };

    function link(scope, element, attrs, ngModelController) {
      ngModelController.$validators.selectUsersValidator = validator;

      // Had to add a watch which fired on model change, as hidden input fields won't fire validator
      scope.$watch(function () {
        return attrs.selectedUsersValidator;
      }, function () {
        ngModelController.$validate();
      });

      function validator(modelValue) {
        for (var guid in modelValue) {
          if (modelValue.hasOwnProperty(guid) && modelValue[guid]) {
            return modelValue;
          }
        }
        return false;
      }
    }
  }

})();
