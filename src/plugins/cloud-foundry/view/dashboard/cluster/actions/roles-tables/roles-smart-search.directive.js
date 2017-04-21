(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster')
    .directive('rolesSmartSearch', RolesSmartSearch);

  /**
   * @memberof cloud-foundry.view.dashboard.cluster
   * @name RolesSmartSearch
   * @description The angular smart table directive has a good search. However applying the same search term to multiple
   * smart tables is tricky. This can be achieved by using this directive
   * @constructor
   */
  function RolesSmartSearch() {
    return {
      require: '^stTable',
      restrict: 'A',
      scope: {
        rolesSmartSearch: '=',
        rolesSmartSearchBy: '@',
        rolesSmartSearchDisable: '='
      },
      link: function (scope, ele, attr, ctrl) {
        scope.$watch('rolesSmartSearch', function (val) {
          if (!scope.rolesSmartSearchDisable) {
            ctrl.search(val, attr.rolesSmartSearchBy);
          } else {
            // Clear any previous search term
            ctrl.search('', attr.rolesSmartSearchBy);
          }
        });
      }
    };
  }
})();
