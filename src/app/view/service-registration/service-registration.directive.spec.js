(function () {
  'use strict';

  describe('service-registration directive', function () {
    var $compile, $httpBackend, $scope;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      $scope.showRegistration = false;
    }));

    describe('without overlay', function () {
      var element, serviceRegistrationCtrl, mockServiceInstance;

      beforeEach(function () {
        mockServiceInstance = {
          name: 'cluster',
          url: 'cluster_url'
        };

        var markup = '<service-registration><service-registration/>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        serviceRegistrationCtrl = element.controller('serviceRegistration');
      });

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should have `overlay` property initially set to true', function () {
        expect(serviceRegistrationCtrl.overlay).toBe(false);
      });

      it('should have undefined `showOverlayRegistration` property', function () {
        expect(serviceRegistrationCtrl.showOverlayRegistration).toBeUndefined();
      });

      it('should have `serviceInstanceModel` property defined', function () {
        expect(serviceRegistrationCtrl.serviceInstanceModel).toBeDefined();
      });

      it('should have `serviceInstances` property initially be []', function () {
        expect(serviceRegistrationCtrl.serviceInstances).toEqual([]);
      });

      it('should have `showFlyout` property initially be false', function () {
        expect(serviceRegistrationCtrl.showFlyout).toBe(false);
      });

      it('should set showFlyout === false on closeFlyout()', function () {
        serviceRegistrationCtrl.enterCredentials(mockServiceInstance);
        serviceRegistrationCtrl.closeFlyout();

        expect(serviceRegistrationCtrl.showFlyout).toBe(false);
      });

      it('should set showFlyout === false and update data on closeFlyout(serviceInstance)', function () {
        serviceRegistrationCtrl.enterCredentials(mockServiceInstance);
        serviceRegistrationCtrl.closeFlyout({ name: 'cluster2', url: 'cluster2_url' });

        var expectedData = { name: 'cluster2', url: 'cluster2_url' };
        expect(serviceRegistrationCtrl.activeServiceInstance).toEqual(expectedData);
        expect(serviceRegistrationCtrl.serviceInstanceModel.numRegistered).toBe(0);
        expect(serviceRegistrationCtrl.showFlyout).toBe(false);
      });

      it('should set showFlyout === false and update data on closeFlyout(serviceInstance)', function () {
        serviceRegistrationCtrl.enterCredentials(mockServiceInstance);
        serviceRegistrationCtrl.closeFlyout({ name: 'cluster2', url: 'cluster2_url', registered: true });

        var expectedData = { name: 'cluster2', url: 'cluster2_url', registered: true };
        expect(serviceRegistrationCtrl.activeServiceInstance).toEqual(expectedData);
        expect(serviceRegistrationCtrl.serviceInstanceModel.numRegistered).toBe(1);
        expect(serviceRegistrationCtrl.showFlyout).toBe(false);
      });

      it('should set showFlyout === true on enterCredentials()', function () {
        serviceRegistrationCtrl.enterCredentials(mockServiceInstance);

        var expectedData = { name: 'cluster', url: 'cluster_url' };
        expect(serviceRegistrationCtrl.activeServiceInstance).toEqual(expectedData);
        expect(serviceRegistrationCtrl.showFlyout).toBe(true);
      });

      it('should call unregister on model on unregister()', function () {
        var model = serviceRegistrationCtrl.serviceInstanceModel;
        model.serviceInstances = [{ name: 'c1', url: 'c1_url', service_user: 'usr1' }];
        model.numRegistered = 1;

        var mockRegistered = { name: 'cluster', url: 'cluster_url', service_user: 'user' };
        var expectedData = { username: undefined, name: 'cluster' };

        $httpBackend.when('POST', '/api/service-instances/unregister').respond(200, {});
        $httpBackend.expectPOST('/api/service-instances/unregister', expectedData);
        serviceRegistrationCtrl.unregister(mockRegistered);
        $httpBackend.flush();

        expect(mockRegistered.registered).toBe(false);
        expect(mockRegistered.service_user).toBeUndefined();
        expect(serviceRegistrationCtrl.serviceInstanceModel.numRegistered).toBe(0);
      });
    });

    describe('with overlay', function () {
      var element, serviceRegistrationCtrl;

      beforeEach(function () {
        var markup = '<service-registration show-overlay-registration="showRegistration">' +
                     '<service-registration/>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        serviceRegistrationCtrl = element.controller('serviceRegistration');
      });

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should have `showOverlayRegistration` property initially set to false', function () {
        expect(serviceRegistrationCtrl.showOverlayRegistration).toBe(false);
      });

      it('should have `overlay` property initially set to true', function () {
        expect(serviceRegistrationCtrl.overlay).toBe(true);
      });

      it('should have `serviceInstanceModel` property defined', function () {
        expect(serviceRegistrationCtrl.serviceInstanceModel).toBeDefined();
      });

      it('should have `serviceInstances` property initially be []', function () {
        expect(serviceRegistrationCtrl.serviceInstances).toEqual([]);
      });

      it('should have `showFlyout` property initially be false', function () {
        expect(serviceRegistrationCtrl.showFlyout).toBe(false);
      });

      it('should be visible when showRegistration === true', function () {
        $scope.showRegistration = true;
        $scope.$apply();

        expect(serviceRegistrationCtrl.showOverlayRegistration).toBe(true);
        expect(element.find('div').length).toBeGreaterThan(0);
      });

      it('should be hidden when registration completed', function () {
        $scope.showRegistration = true;
        $scope.$apply();

        serviceRegistrationCtrl.completeRegistration();
        $scope.$apply();

        expect(serviceRegistrationCtrl.showOverlayRegistration).toBe(false);
        expect(element.find('div').length).toBe(0);
      });
    });
  });

})();
