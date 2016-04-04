(function () {
  'use strict';

  /**
   * @namespace app.view
   * @memberof app
   * @name view
   * @description The view layer of the UI platform that contains
   * the Angular directives and controllers
   */
  angular
    .module('app.view', [
      'app.view.settings-page',
      'ncy-angular-breadcrumb'
    ])
    .config(config);
    
  config.$inject = [
    '$breadcrumbProvider'
  ];
  
  function config($breadcrumbProvider) {
    $breadcrumbProvider.setOptions({
      template: '<ol class="breadcrumb">' +
      '<li ng-repeat="step in steps" ng-class="{active: $last}" ng-switch="$last || !!step.abstract">' +
      '<a ng-switch-when="false" ui-sref="{{step.name}}" href="{{step.ncyBreadcrumbLink}}">{{step.ncyBreadcrumbLabel}}</a>' +
      '<span ng-switch-when="true">{{step.ncyBreadcrumbLabel}}</span>' +
      '</li>' +
      '</ol>'
    });
  }

})();
