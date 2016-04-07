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

      $httpBackend.when('GET', '/api/service-instances').respond(200, { items: items });
    }));

    describe('without overlay', function () {
      var element, clusterRegistrationCtrl;

      beforeEach(function () {
        var markup = '<cluster-registration><cluster-registration/>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        clusterRegistrationCtrl = element.controller('clusterRegistration');
        clusterRegistrationCtrl.userModel.data = { id: 1 };
      });

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should have `overlay` property initially set to true', function () {
        expect(clusterRegistrationCtrl.overlay).toBe(false);
      });

      it('should have undefined `showOverlayRegistration` property', function () {
        expect(clusterRegistrationCtrl.showOverlayRegistration).toBeUndefined();
      });

      it('should have `clusterInstanceModel` property defined', function () {
        expect(clusterRegistrationCtrl.clusterInstanceModel).toBeDefined();
      });

      it('should have `clusterInstances` property initially be []', function () {
        expect(clusterRegistrationCtrl.clusterInstances).toEqual([]);
      });

      it('should call connect on model on connect()', function () {
        $httpBackend.flush();

        var clusterInstance = { name: 'c1', url: 'c1_url' };
        var mockResponse = {
          id: 1,
          url: 'c1_url',
          username: 'dev',
          account: 'dev',
          expires_at: 3600
        };
        $httpBackend.when('POST', '/api/service-instances/connect').respond(200, mockResponse);

        clusterRegistrationCtrl.connect(clusterInstance);
        $httpBackend.flush();

        expect(clusterInstance.account).toBe('dev');
        expect(clusterInstance.expires_at).toBe(3600);
        expect(clusterInstance.valid).toBe(true);
        expect(clusterRegistrationCtrl.clusterInstanceModel.numValid).toBe(1);
      });

      it('should call disconnect on model on disconnect()', function () {
        $httpBackend.flush();

        var clusterInstance = { name: 'c1', url: 'c1_url' };
        var mockResponse = {
          id: 1,
          url: 'c1_url',
          username: 'dev',
          account: 'dev',
          expires_at: 3600
        };

        $httpBackend.when('POST', '/api/service-instances/connect').respond(200, mockResponse);
        clusterRegistrationCtrl.connect(clusterInstance);
        $httpBackend.flush();

        $httpBackend.when('DELETE', '/api/service-instances/1').respond(200, {});
        $httpBackend.expectDELETE('/api/service-instances/1');
        clusterRegistrationCtrl.disconnect(clusterInstance);
        $httpBackend.flush();

        expect(clusterInstance.account).toBeUndefined();
        expect(clusterInstance.expires_at).toBeUndefined();
        expect(clusterInstance.valid).toBeUndefined();
        expect(clusterRegistrationCtrl.clusterInstanceModel.numValid).toBe(0);
      });
    });

    describe('with overlay', function () {
      var element, clusterRegistrationCtrl;

      beforeEach(function () {
        var markup = '<cluster-registration show-overlay-registration="showRegistration">' +
                     '<cluster-registration/>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        clusterRegistrationCtrl = element.controller('clusterRegistration');
        clusterRegistrationCtrl.userModel.data = { id: 1 };
      });

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should have `showOverlayRegistration` property initially set to false', function () {
        expect(clusterRegistrationCtrl.showOverlayRegistration).toBe(false);
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

        expect(clusterRegistrationCtrl.showOverlayRegistration).toBe(true);
        expect(element.find('div').length).toBeGreaterThan(0);
      });

      it('should not be hidden on completeRegistration() and numValid === 0', function () {
        spyOn(clusterRegistrationCtrl.userModel, 'updateRegistered').and.callThrough();
        $scope.showRegistration = true;
        $scope.$apply();

        clusterRegistrationCtrl.completeRegistration();

        expect(clusterRegistrationCtrl.userModel.updateRegistered).not.toHaveBeenCalled();
        expect(clusterRegistrationCtrl.showOverlayRegistration).toBe(true);
      });

      it('should be hidden on completeRegistration() and numValid > 0', function () {
        spyOn(clusterRegistrationCtrl.userModel, 'updateRegistered').and.callThrough();
        $scope.showRegistration = true;
        $scope.$apply();

        clusterRegistrationCtrl.clusterInstances = [
          { name: 'c1', url: 'c1_url', username: 'dev', expires_at: 3600, valid: true },
          { name: 'c2', url: 'c2_url', username: 'dev', expires_at: 3600, valid: true },
          { name: 'c3', url: 'c3_url' }
        ];
        clusterRegistrationCtrl.clusterInstanceModel.numValid = 2;

        $httpBackend.when('PUT', '/api/users/1').respond(200, { registered: true });
        $httpBackend.expectPUT('/api/users/1', { registered: true });
        clusterRegistrationCtrl.completeRegistration();
        $httpBackend.flush();

        expect(clusterRegistrationCtrl.userModel.updateRegistered).toHaveBeenCalledWith(true);
        expect(clusterRegistrationCtrl.showOverlayRegistration).toBe(false);
      });
    });
  });

})();
