(function () {
  'use strict';

  angular
    .module('helionFrameworkExamples.tabs', ['ui.bootstrap'])
    .controller('TabsDemoController', function ($scope, $window, $timeout) {

      $scope.tabs = [
        {title: 'Dynamic Title 1', content: 'This is dynamic content 1'},
        {title: 'Dynamic Title 2', content: 'This is dynamic content 2', disabled: true}
      ];

      $scope.alertMe = function () {
        $timeout(function () {
          $window.alert("You've selected the alert tab!");
        });
      };

      $scope.model = {
        name: 'Tabs'
      };
    });

})();
