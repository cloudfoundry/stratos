/**
 * Created by sean on 10/12/16.
 */

(function () {
  'use strict';

  angular
    .module('e2e-loader', ['green-box-console', 'console-e2e-mocks']);

  angular
    .module('green-box-console', []);

  angular
    .module('green-box-console')
    .directive('inspector', inspector);

  inspector.$inject = [
  ];

  function inspector() {
    return {
      controller: InspectorController,
      controllerAs: 'inspectorCtrl',
      template: '<h1>Hello, -- !!world!</h1>'
    };
  }

  InspectorController.$inject = [
    '$http'
  ];

  function InspectorController($http) {
    $http.get('/api/foo');
  }

})();


