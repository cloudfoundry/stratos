(function () {
  'use strict';

  describe('service-registration directive', function () {
    var $compile, $httpBackend, $httpParamSerializer, $scope;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $httpParamSerializer = $injector.get('$httpParamSerializer');
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

      $httpBackend.when('GET', '/pp/v1/proxy/v2/info').respond(200, {});
      $httpBackend.when('GET', '/pp/v1/proxy/v2/apps?results-per-page=48').respond(200, { guid: {} });
      $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, items);
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, items);
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

      it('should have `userCnsiModel` property defined', function () {
        expect(serviceRegistrationCtrl.userCnsiModel).toBeDefined();
      });

      it('should have `serviceInstances` property initially be {}', function () {
        expect(serviceRegistrationCtrl.serviceInstances).toEqual({});
      });

      it('should open credentials flyout on connect()', function () {
        var serviceInstance = { name: 'c1', url: 'c1_url' };
        serviceRegistrationCtrl.connect(serviceInstance);

        expect(serviceRegistrationCtrl.activeServiceInstance).toBeDefined();
        expect(serviceRegistrationCtrl.credentialsFormOpen).toBe(true);
      });

      it('should call disconnect on model on disconnect()', function () {
        var initialNumValid = serviceRegistrationCtrl.userCnsiModel.numValid;

        var data = { cnsi_guid: 'cnsi_guid' };
        $httpBackend.expectPOST('/pp/v1/auth/logout/cnsi', $httpParamSerializer(data)).respond(200, '');

        var serviceInstance = { guid: 'cnsi_guid' };

        serviceRegistrationCtrl.disconnect(serviceInstance);
        $httpBackend.flush();

        expect(serviceInstance.account).toBeUndefined();
        expect(serviceInstance.expires_at).toBeUndefined();
        expect(serviceInstance.valid).toBeUndefined();
        expect(serviceRegistrationCtrl.userCnsiModel.numValid).toBe(initialNumValid - 1);
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

      it('should have `userCnsiModel` property defined', function () {
        expect(serviceRegistrationCtrl.userCnsiModel).toBeDefined();
      });

      it('should have `serviceInstances` property initially be {}', function () {
        expect(serviceRegistrationCtrl.serviceInstances).toEqual({});
      });

      it('should be visible when showRegistration === true', function () {
        $scope.showRegistration = true;
        $scope.$apply();

        expect(serviceRegistrationCtrl.showOverlayRegistration).toBe(true);
        expect(element.find('div').length).toBeGreaterThan(0);
      });

      // You can now hide the registration dialog even if you did not connect any services
      it('should be hidden on completeRegistration() and numValid === 0', function () {
        $scope.showRegistration = true;
        $scope.$apply();

        serviceRegistrationCtrl.completeRegistration();

        expect(serviceRegistrationCtrl.showOverlayRegistration).toBe(false);
      });

      it('should be hidden on completeRegistration() and numValid > 0', function () {
        $scope.showRegistration = true;
        $scope.$apply();

        serviceRegistrationCtrl.serviceInstances = [
          { name: 'c1', url: 'c1_url', api_endpoint: { Scheme: 'http', Host: 'c1_url' }, username: 'dev', token_expiry: 3600, valid: true },
          { name: 'c2', url: 'c2_url', api_endpoint: { Scheme: 'http', Host: 'c2_url' },username: 'dev', token_expiry: 3600, valid: true },
          { name: 'c3', url: 'c3_url', api_endpoint: { Scheme: 'http', Host: 'c3_url' } }
        ];
        serviceRegistrationCtrl.userCnsiModel.numValid = 2;

        //$httpBackend.when('PUT', '/api/users/1').respond(200, { registered: true });
        //$httpBackend.expectPUT('/api/users/1', { registered: true });
        serviceRegistrationCtrl.completeRegistration();
        $httpBackend.flush();

        expect(serviceRegistrationCtrl.showOverlayRegistration).toBe(false);
      });
    });
  });

})();
