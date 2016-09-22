(function () {
  'use strict';

  describe('service-registration directive', function () {
    var $compile, $httpBackend, $scope, $q;
    var detailViewCalled = false;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module(function ($provide) {
      var mock = function () {
        detailViewCalled = true;
        return {rendered: $q.resolve(), result: $q.reject()};
      };
      $provide.value('helion.framework.widgets.detailView', mock);
    }));
    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      $scope = $injector.get('$rootScope').$new();
      $scope.showRegistration = false;

      var items = [{
        id: 1,
        name: 'c1',
        url: 'c1_url',
        api_endpoint: {
          Scheme: 'http',
          Host: 'api.foo.com'
        }
      }];

      $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, items);
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, items);
    }));

    describe('service tile tests', function () {
      var element, serviceTileCtrl;

      beforeEach(function () {
        var markup = '<service-tile><service-tile/>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        serviceTileCtrl = element.controller('serviceTile');
      });

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should show cluster registration detail view when showClusterAddForm is invoked', function () {
        serviceTileCtrl.showClusterAddForm();
        expect(detailViewCalled).toBe(true);
      });
    });
  });

})();
