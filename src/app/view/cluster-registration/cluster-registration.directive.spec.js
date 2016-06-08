(function () {
  'use strict';

  describe('cluster-registration directive', function () {
    var $compile, $httpBackend, $scope;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      $scope.showRegistration = false;

      var items = [{
        id: 1,
        name: 'c1',
        url: 'c1_url'
      }];

      $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, { items: items });
    }));

    describe('without overlay', function () {
      var element, clusterRegistrationCtrl;

      beforeEach(function () {
        var markup = '<cluster-registration><cluster-registration/>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        clusterRegistrationCtrl = element.controller('clusterRegistration');
      });

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should have `overlay` property initially set to true', function () {
        expect(clusterRegistrationCtrl.overlay).toBe(false);
      });

      it('should have undefined `showClusterOverlayRegistration` property', function () {
        expect(clusterRegistrationCtrl.showClusterOverlayRegistration).toBeUndefined();
      });

      it('should have `clusterInstanceModel` property defined', function () {
        expect(clusterRegistrationCtrl.clusterInstanceModel).toBeDefined();
      });

      it('should have `clusterInstances` property initially be []', function () {
        expect(clusterRegistrationCtrl.clusterInstances).toEqual([]);
      });
    });

    describe('with overlay', function () {
      var element, clusterRegistrationCtrl;

      beforeEach(function () {
        var markup = '<cluster-registration show-cluster-overlay-registration="showRegistration">' +
                     '<cluster-registration/>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        clusterRegistrationCtrl = element.controller('clusterRegistration');
      });

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should have `showClusterOverlayRegistration` property initially set to false', function () {
        expect(clusterRegistrationCtrl.showClusterOverlayRegistration).toBe(false);
      });

      it('should have `overlay` property initially set to true', function () {
        expect(clusterRegistrationCtrl.overlay).toBe(true);
      });

      it('should have `clusterInstanceModel` property defined', function () {
        expect(clusterRegistrationCtrl.clusterInstanceModel).toBeDefined();
      });

      it('should have `clusterInstances` property initially be []', function () {
        expect(clusterRegistrationCtrl.clusterInstances).toEqual([]);
      });

      it('should be visible when showRegistration === true', function () {
        $scope.showRegistration = true;
        $scope.$apply();

        expect(clusterRegistrationCtrl.showClusterOverlayRegistration).toBe(true);
        expect(element.find('div').length).toBeGreaterThan(0);
      });

    });
  });

})();
