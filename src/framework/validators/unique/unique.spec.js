(function () {
  'use strict';

  describe('validators :', function () {

    beforeEach(module('helion.framework.validators'));

    describe('helion-unique - editing with complex table data', function () {
      var $compile, $scope, $form;

      var markup =
        '<form name="testForm">"' +
        '<input type="text" name="serverName" ng-model="data.serverName" items="servers" key="\'name\'" helion-unique/>' +
        '</form>';

      beforeEach(inject(function ($injector) {
        $compile = $injector.get('$compile');
        $scope = $injector.get('$rootScope').$new();
        $scope.data = {
          serverName: 'controller1'
        };
        $scope.servers = [
          {name: 'controller1'},
          {name: 'controller2'},
          {name: 'controller3'}
        ];
        $compile(angular.element(markup))($scope);
        $form = $scope.testForm;
        $scope.$apply();
      }));

      it('should pass validation if there is no input', function () {
        expect($form.serverName.$valid).toBe(true);
        expect($form.$valid).toBe(true);
      });

      it('should pass validation if viewValue is unique', function () {
        ['',
          'controller1',
          'controller4'
        ].forEach(function (name) {
          $form.serverName.$setViewValue(name);
          $scope.$apply();
          expect($form.serverName.$valid).toBe(true);
          expect($form.$valid).toBe(true);
        });
      });

      it('should not pass validation if viewValue is not unique', function () {
        ['controller2',
          'controller3'
        ].forEach(function (name) {
          var field = $form.serverName;
          field.$setViewValue(name);
          expect(field.$valid).not.toBe(true);
          expect($form.$valid).not.toBe(true);
        });
      });

    });

    describe('helion-unique - adding with complex table data', function () {
      var $compile, $scope, $form;

      var markup =
        '<form name="testForm">"' +
        '<input type="text" name="serverName" ng-model="data.serverName" items="servers" key="\'name\'" helion-unique/>' +
        '</form>';

      beforeEach(inject(function ($injector) {
        $compile = $injector.get('$compile');
        $scope = $injector.get('$rootScope').$new();
        $scope.data = {};
        $scope.servers = [
          {name: 'controller1'},
          {name: 'controller2'},
          {name: 'controller3'}
        ];
        $compile(angular.element(markup))($scope);
        $form = $scope.testForm;
        $scope.$apply();
      }));

      it('should pass validation if there is no input', function () {
        expect($form.serverName.$valid).toBe(true);
        expect($form.$valid).toBe(true);
      });

      it('should pass validation if viewValue is unique', function () {
        ['',
          'controller4'
        ].forEach(function (name) {
          $form.serverName.$setViewValue(name);
          $scope.$apply();
          expect($form.serverName.$valid).toBe(true);
          expect($form.$valid).toBe(true);
        });
      });

      it('should not pass validation if viewValue is not unique', function () {
        ['controller1',
          'controller2',
          'controller3'
        ].forEach(function (name) {
          var field = $form.serverName;
          field.$setViewValue(name);
          expect(field.$valid).not.toBe(true);
          expect($form.$valid).not.toBe(true);
        });
      });

    });

    describe('helion-unique - edting with simple table data', function () {
      var $compile, $scope, $form;

      var markup =
        '<form name="testForm">"' +
        '<input type="text" name="serverName" ng-model="data.serverName" items="servers" helion-unique/>' +
        '</form>';

      beforeEach(inject(function ($injector) {
        $compile = $injector.get('$compile');
        $scope = $injector.get('$rootScope').$new();
        $scope.data = {
          serverName: 'controller1'
        };
        $scope.servers = [
          'controller1',
          'controller2',
          'controller3'
        ];
        $compile(angular.element(markup))($scope);
        $form = $scope.testForm;
        $scope.$apply();
      }));

      it('should pass validation if there is no input', function () {
        expect($form.serverName.$valid).toBe(true);
        expect($form.$valid).toBe(true);
      });

      it('should pass validation if viewValue is unique', function () {
        ['',
          'controller1',
          'controller4'
        ].forEach(function (name) {
          $form.serverName.$setViewValue(name);
          $scope.$apply();
          expect($form.serverName.$valid).toBe(true);
          expect($form.$valid).toBe(true);
        });
      });

      it('should not pass validation if viewValue is not unique', function () {
        ['controller2',
          'controller3'
        ].forEach(function (name) {
          var field = $form.serverName;
          field.$setViewValue(name);
          expect(field.$valid).not.toBe(true);
          expect($form.$valid).not.toBe(true);
        });
      });
    });

    describe('helion-unique - adding with simple table data', function () {
      var $compile, $scope, $form;

      var markup =
        '<form name="testForm">"' +
        '<input type="text" name="serverName" ng-model="data.serverName" items="servers" helion-unique/>' +
        '</form>';

      beforeEach(inject(function ($injector) {
        $compile = $injector.get('$compile');
        $scope = $injector.get('$rootScope').$new();
        $scope.data = {};
        $scope.servers = [
          'controller1',
          'controller2',
          'controller3'
        ];
        $compile(angular.element(markup))($scope);
        $form = $scope.testForm;
        $scope.$apply();
      }));

      it('should pass validation if there is no input', function () {
        expect($form.serverName.$valid).toBe(true);
        expect($form.$valid).toBe(true);
      });

      it('should pass validation if viewValue is unique', function () {
        ['',
          'controller4'
        ].forEach(function (name) {
          $form.serverName.$setViewValue(name);
          $scope.$apply();
          expect($form.serverName.$valid).toBe(true);
          expect($form.$valid).toBe(true);
        });
      });

      it('should not pass validation if viewValue is not unique', function () {
        ['controller1',
          'controller2',
          'controller3'
        ].forEach(function (name) {
          var field = $form.serverName;
          field.$setViewValue(name);
          expect(field.$valid).not.toBe(true);
          expect($form.$valid).not.toBe(true);
        });
      });
    });
  });
})();
