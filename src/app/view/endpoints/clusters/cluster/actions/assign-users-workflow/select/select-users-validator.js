(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .directive('selectedUsersValidator', selectedUsers);

  /**
   * @namespace app.view.endpoints.clusters.cluster
   * @name selectedUsers
   * @description A validator that checks the model has at least one truthy property
   * @returns {object} directive configuration
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
