(function () {
  'use strict';

  describe('cluster-actions and unique-space-name directives', function () {
    var $httpBackend, element, $compile;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $compile = $injector.get('$compile');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('cluster-actions', function () {
      var initialState;

      beforeEach(inject(function ($injector) {
        var $state = $injector.get('$state');
        initialState = $state.go('endpoint.dashboard');

        // Ensure we have an initial state for the chainStateResolve to chain on to
        initialState = initialState.then(function () {
          var contextScope = $injector.get('$rootScope').$new();

          element = angular.element('<cluster-actions></cluster-actions>');
          $compile(element)(contextScope);

        });

      }));

      it('should be defined', function () {
        initialState.then(function () {
          expect(element).toBeDefined();
          expect(element.controller).toBeDefined();
        });

      });
    });

    describe('unique-space-name', function () {

      beforeEach(inject(function ($injector) {

        var contextScope = $injector.get('$rootScope').$new();
        contextScope.model = '';

        element = angular.element('<input unique-space-name ng-model="model"></input>');
        $compile(element)(contextScope);

      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });
    });

  });

})();
