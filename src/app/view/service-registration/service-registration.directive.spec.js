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

      var items = [{
        id: 1,
        name: 'c1',
        url: 'c1_url'
      }];

      $httpBackend.when('GET', '/api/service-instances/user').respond(200, { items: items });
    }));

    describe('without overlay', function () {
      var element, serviceRegistrationCtrl;

      beforeEach(function () {
        var markup = '<service-registration><service-registration/>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        serviceRegistrationCtrl = element.controller('serviceRegistration');
        serviceRegistrationCtrl.userModel.data = { id: 1 };
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

      it('should open credentials flyout on connect()', function () {
        var serviceInstance = { name: 'c1', url: 'c1_url' };
        serviceRegistrationCtrl.connect(serviceInstance);

        expect(serviceRegistrationCtrl.activeServiceInstance).toBeDefined();
        expect(serviceRegistrationCtrl.credentialsFormOpen).toBe(true);
      });

      it('should call disconnect on model on disconnect()', function () {
        $httpBackend.flush();

        var serviceInstance = { name: 'c1', url: 'c1_url' };
        var mockResponse = {
          id: 1,
          url: 'c1_url',
          username: 'dev',
          account: 'dev',
          expires_at: 3600
        };

        serviceRegistrationCtrl.connect(serviceInstance);
        serviceRegistrationCtrl.onConnectSuccess(mockResponse);

        $httpBackend.when('DELETE', '/api/service-instances/user/1').respond(200, {});
        $httpBackend.expectDELETE('/api/service-instances/user/1');
        serviceRegistrationCtrl.disconnect(serviceInstance);
        $httpBackend.flush();

        expect(serviceInstance.account).toBeUndefined();
        expect(serviceInstance.expires_at).toBeUndefined();
        expect(serviceInstance.valid).toBeUndefined();
        expect(serviceRegistrationCtrl.serviceInstanceModel.numValid).toBe(0);
      });

      it('should hide credentials form flyout `onConnectCancel`', function () {
        serviceRegistrationCtrl.credentialsFormOpen = true;
        serviceRegistrationCtrl.onConnectCancel();
        expect(serviceRegistrationCtrl.credentialsFormOpen).toBe(false);
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
        serviceRegistrationCtrl.userModel.data = { id: 1 };
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

      it('should not be hidden on completeRegistration() and numValid === 0', function () {
        spyOn(serviceRegistrationCtrl.userModel, 'updateRegistered').and.callThrough();
        $scope.showRegistration = true;
        $scope.$apply();

        serviceRegistrationCtrl.completeRegistration();

        expect(serviceRegistrationCtrl.userModel.updateRegistered).not.toHaveBeenCalled();
        expect(serviceRegistrationCtrl.showOverlayRegistration).toBe(true);
      });

      it('should be hidden on completeRegistration() and numValid > 0', function () {
        spyOn(serviceRegistrationCtrl.userModel, 'updateRegistered').and.callThrough();
        $scope.showRegistration = true;
        $scope.$apply();

        serviceRegistrationCtrl.serviceInstances = [
          { name: 'c1', url: 'c1_url', username: 'dev', expires_at: 3600, valid: true },
          { name: 'c2', url: 'c2_url', username: 'dev', expires_at: 3600, valid: true },
          { name: 'c3', url: 'c3_url' }
        ];
        serviceRegistrationCtrl.serviceInstanceModel.numValid = 2;

        $httpBackend.when('PUT', '/api/users/1').respond(200, { registered: true });
        $httpBackend.expectPUT('/api/users/1', { registered: true });
        serviceRegistrationCtrl.completeRegistration();
        $httpBackend.flush();

        expect(serviceRegistrationCtrl.userModel.updateRegistered).toHaveBeenCalledWith(true);
        expect(serviceRegistrationCtrl.showOverlayRegistration).toBe(false);
      });
    });
  });

})();
