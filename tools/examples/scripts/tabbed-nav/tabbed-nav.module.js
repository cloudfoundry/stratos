(function () {
  'use strict';

  angular
    .module('helionFrameworkExamples.tabbed-nav', [])
    .config(TabbedNavRouteConfig);

  TabbedNavRouteConfig.$inject = [
    '$stateProvider'
  ];

  function TabbedNavRouteConfig($stateProvider) {
    $stateProvider
      .state('tab1', {
        url: '/tabbedNav/tab1',
        views: {
          exampleView: {
            templateUrl: 'scripts/tabbed-nav/tab-content.html',
            controller: function ($scope) {
              $scope.title = 'Tab 1';
            }
          }
        },
        ncyBreadcrumb: {
          label: 'Tab Number 1'
        }
      }).state('tab2', {
        url: '/tabbedNav/tab2',
        views: {
          exampleView: {
            templateUrl: 'scripts/tabbed-nav/tab-content.html',
            controller: function ($scope) {
              $scope.title = 'Tab 2';
            }
          }
        },
        ncyBreadcrumb: {
          label: 'Tab Number 2'
        }
      }).state('tab3', {
        url: '/tabbedNav/tab3',
        views: {
          exampleView: {
            templateUrl: 'scripts/tabbed-nav/tab-content.html',
            controller: function ($scope) {
              $scope.title = 'Tab 3';
            }
          }
        },
        ncyBreadcrumb: {
          label: 'Tab Number 3'
        }
      });
  }

})();
