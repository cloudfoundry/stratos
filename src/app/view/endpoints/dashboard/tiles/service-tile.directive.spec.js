(function () {
  'use strict';

  describe('service-registration directive', function () {
    var $compile, $httpBackend, $scope, $q;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
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
        expect(serviceTileCtrl).toBeDefined();
      });

      it('should show register hcf if tile is hcf', function () {
        serviceTileCtrl.serviceType = 'hcf';
        spyOn(serviceTileCtrl.hcfRegistration, 'add').and.returnValue($q.resolve());
        serviceTileCtrl.showClusterAddForm();
        expect(serviceTileCtrl.hcfRegistration.add).toHaveBeenCalled();
      });

      it('should show register hce if tile is hce', function () {
        serviceTileCtrl.serviceType = 'hce';
        spyOn(serviceTileCtrl.hceRegistration, 'add').and.returnValue($q.resolve());
        serviceTileCtrl.showClusterAddForm();
        expect(serviceTileCtrl.hceRegistration.add).toHaveBeenCalled();
      });

      it('_listServiceInstances - with cached data', function () {
        spyOn(serviceTileCtrl, '_updateChart');

        expect(serviceTileCtrl.resolvedPromise).toBeFalsy();
        serviceTileCtrl.useCachedData = true;
        serviceTileCtrl._listServiceInstances();
        $scope.$digest();

        expect(serviceTileCtrl.resolvedPromise).toBeTruthy();
        expect(serviceTileCtrl._updateChart).toHaveBeenCalled();
      });

      it('_updateInstances', function () {
        spyOn(serviceTileCtrl, '_updateChart');

        var service = {
          cnsi_type: 'service_type',
          guid: 'serviceGuid'
        };
        serviceTileCtrl.serviceType = service.cnsi_type;
        _.set(serviceTileCtrl, 'serviceInstanceModel.serviceInstances', [service]);
        serviceTileCtrl._updateInstances();
        var result = _.set({}, service.guid, service);

        expect(serviceTileCtrl.serviceInstances).toEqual(result);
        expect(serviceTileCtrl._updateChart).toHaveBeenCalled();
      });

      it('getInstancesCountByStatus - connected', function () {

        expect(serviceTileCtrl.getInstancesCountByStatus('connected')).toBe(0);

        serviceTileCtrl.serviceInstances = {
          cnsiGuid: {}
        };

        expect(serviceTileCtrl.getInstancesCountByStatus('connected')).toBe(0);

        serviceTileCtrl.userServiceInstanceModel.serviceInstances = {
          cnsiGuid: {
            valid: true
          }
        };
        expect(serviceTileCtrl.getInstancesCountByStatus('connected')).toBe(1);
      });

      it('getInstancesCountByStatus - dsiconnected', function () {

        expect(serviceTileCtrl.getInstancesCountByStatus('disconnected')).toBe(0);

        serviceTileCtrl.serviceInstances = {
          cnsiGuid: {}
        };

        expect(serviceTileCtrl.getInstancesCountByStatus('disconnected')).toBe(1);
      });

    });
  });

})();
