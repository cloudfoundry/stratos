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

      var modelManager = $injector.get('app.model.modelManager');
      var account = modelManager.retrieve('app.model.account');
      account.data = { username: 'dev' };
    }));

    describe('without overlay', function () {
      var element, serviceRegistrationCtrl;

      beforeEach(function () {
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

      it('should call connect on model on connect()', function () {
        var serviceInstance = { name: 'cluster1', url: 'cluster1_url' };
        var mockResponse = {
          name: 'cluster1',
          url: 'cluster1_url',
          account: 'dev',
          expires_at: 3600
        };
        $httpBackend.when('POST', '/api/user-service-instances/connect').respond(200, mockResponse);

        serviceRegistrationCtrl.connect(serviceInstance);
        $httpBackend.flush();

        expect(serviceInstance.account).toBe('dev');
        expect(serviceInstance.expires_at).toBe(3600);
        expect(serviceRegistrationCtrl.serviceInstanceModel.numRegistered).toBe(1);
      });

      it('should call disconnect on model on disconnect()', function () {
        var model = serviceRegistrationCtrl.serviceInstanceModel;
        model.serviceInstances = [{ name: 'c1', url: 'c1_url', account: 'usr1' }];
        model.numRegistered = 1;

        var mockRegistered = { name: 'cluster', url: 'cluster_url', account: 'usr1' };
        var expectedData = { url: 'cluster_url' };

        $httpBackend.when('POST', '/api/user-service-instances/disconnect').respond(200, {});
        $httpBackend.expectPOST('/api/user-service-instances/disconnect', expectedData);
        serviceRegistrationCtrl.disconnect(mockRegistered);
        $httpBackend.flush();

        expect(mockRegistered.account).toBeUndefined();
        expect(mockRegistered.expires_at).toBeUndefined();
        expect(mockRegistered.registered).toBeUndefined();
        expect(mockRegistered.valid).toBeUndefined();
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

      it('should be visible when showRegistration === true', function () {
        $scope.showRegistration = true;
        $scope.$apply();

        expect(serviceRegistrationCtrl.showOverlayRegistration).toBe(true);
        expect(element.find('div').length).toBeGreaterThan(0);
      });

      it('should be hidden when registration completed', function () {
        spyOn(serviceRegistrationCtrl.serviceInstanceModel, 'register').and.callThrough();
        $scope.showRegistration = true;
        $scope.$apply();

        serviceRegistrationCtrl.completeRegistration();

        expect(serviceRegistrationCtrl.serviceInstanceModel.register).not.toHaveBeenCalled();
        expect(serviceRegistrationCtrl.showOverlayRegistration).toBe(true);
      });

      it('should be hidden when registration completed', function () {
        spyOn(serviceRegistrationCtrl.serviceInstanceModel, 'register').and.callThrough();
        $scope.showRegistration = true;
        $scope.$apply();

        serviceRegistrationCtrl.serviceInstances = [
          { name: 'cluster1', URL: 'cluster1_url', username: 'dev', valid: true },
          { name: 'cluster2', URL: 'cluster2_url', username: 'dev', valid: true },
          { name: 'cluster3', URL: 'cluster3_url' }
        ];
        serviceRegistrationCtrl.serviceInstanceModel.numRegistered = 2;

        $httpBackend.when('POST', '/api/user-service-instances/register').respond(200, {});
        serviceRegistrationCtrl.completeRegistration();
        $httpBackend.flush();

        expect(serviceRegistrationCtrl.serviceInstanceModel.register).toHaveBeenCalled();
        expect(serviceRegistrationCtrl.showOverlayRegistration).toBe(false);
      });
    });
  });

})();
