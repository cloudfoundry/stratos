(function () {
  'use strict';

  describe('list-table directive', function () {
    var $compile;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
    }));

    describe('with default settings', function () {
      var $scope, element;

      beforeEach(inject(function ($injector) {
        $scope = $injector.get('$rootScope').$new();
        $scope.selected = [];
        $scope.mockData = [
          {name: 'NodeJS', description: 'API component, NodeJS, docker container', az: 'US East'},
          {name: 'RoR', description: 'API component, Ruby on Rails 5, docker container', az: 'US West'}
        ];

        var markup = '<table st-table="mockData" list-table="selected" class="table">' +
          '<thead><tr><th>Name</th><th>Description</th><th>AZ</th></tr></thead>' +
          '<tbody><tr ng-repeat="row in mockData">' +
          '<td>{{ row.name }}</td><td>{{ row.description }}</td><td>{{ row.az }}</td>' +
          '</tr></tbody></table>';

        element = angular.element(markup);
        $compile(element)($scope);
        $scope.$apply();
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should be able to update the selected row', function () {
        var listTableCtrl = element.controller('listTable');
        expect(listTableCtrl).toBeDefined();
        expect($scope.selected.length).toBe(0);
        listTableCtrl.updateSelected($scope.mockData[0], true);
        expect($scope.selected.length).toBe(1);
        listTableCtrl.updateSelected($scope.mockData[0], false);
        expect($scope.selected.length).toBe(0);
      });
    });
  });
})();
