(function () {
  'use strict';

  describe('cluster-settings directive', function () {
    var $compile, $httpBackend, $scope;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
    }));

    describe('basic', function () {
      var element, clusterSettingsCtrl;

      beforeEach(function () {
        var markup = '<cluster-settings showOverlayRegistration="false"><cluster-settings/>';
        element = angular.element(markup);
        $compile(element)($scope);

        var items = [{
          guid: 1,
          name: 'c1',
          url: 'c1_url',
          api_endpoint: {
            Scheme: 'http',
            Host: 'api.foo.com'
          }
        }];

        var stackatoInfo = mock.stackatoInfoAPI.Routes.stackatoInfo();
        $httpBackend.when('GET', stackatoInfo.url).respond(200, stackatoInfo.response['200'].body);
        $httpBackend.expectGET(stackatoInfo.url);

        $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, items);
        $httpBackend.expectGET('/pp/v1/cnsis/registered');

        $scope.$apply();
        $httpBackend.flush();
        clusterSettingsCtrl = element.controller('clusterSettings');
      });

      it('should be defined', function () {
        expect(element).toBeDefined();
        expect(clusterSettingsCtrl).toBeDefined();
      });

      it('should have credentails form closed', function () {
        expect(clusterSettingsCtrl.credentialsFormOpen).toBe(false);
      });

      it('should fetch when stackato info changes', function () {
        expect(Object.keys(clusterSettingsCtrl.serviceInstances).length).toBe(6);

        var hce1 = clusterSettingsCtrl.serviceInstances['f0b0f8c6-d00d-47f2-8636-1f558f7ec48e'];
        var hcf4 = clusterSettingsCtrl.serviceInstances['d13aa0f2-4500-4e0d-aa14-1b9f4e0769d8'];
        var other = clusterSettingsCtrl.serviceInstances['a0b0f8c6-d00d-47f2-8636-1f558f7ec48e'];
        expect(hcf4).toBeDefined();
        expect(hcf4.name).toBe('HCF_4');
        expect(clusterSettingsCtrl.isValid(hcf4)).toBe(true);
        expect(clusterSettingsCtrl.getCnsiTypeText(hcf4)).toBe('Helion Cloud Foundry');
        expect(clusterSettingsCtrl.getCnsiTypeText(hce1)).toBe('Helion Code Engine');
        expect(clusterSettingsCtrl.getCnsiTypeText(other)).toBe('other');

        //$httpBackend.when('GET', stackatoInfo.url).respond(200, stackatoInfo.response['200'].body);
        //$httpBackend.expectGET(stackatoInfo.url);
        $scope.$apply();
      });

      it('should support connect methods', function () {
        var hcf4 = clusterSettingsCtrl.serviceInstances['d13aa0f2-4500-4e0d-aa14-1b9f4e0769d8'];
        expect(clusterSettingsCtrl.activeServiceInstance).toBe(null);
        clusterSettingsCtrl.reconnect(hcf4);
        expect(clusterSettingsCtrl.activeServiceInstance).toBe(hcf4);
        expect(clusterSettingsCtrl.dialog).toBeDefined();
        clusterSettingsCtrl.onConnectCancel();
        expect(clusterSettingsCtrl.activeServiceInstance).not.toBeDefined();
        expect(clusterSettingsCtrl.dialog).not.toBeDefined();
        clusterSettingsCtrl.reconnect(hcf4);
        expect(clusterSettingsCtrl.activeServiceInstance).toBe(hcf4);
        expect(clusterSettingsCtrl.dialog).toBeDefined();
        clusterSettingsCtrl.onConnectSuccess();
        expect(clusterSettingsCtrl.dialog).not.toBeDefined();
        expect(clusterSettingsCtrl.activeServiceInstance).not.toBeDefined();
      });

      it('should support disconnect', function () {
        var hcf4 = clusterSettingsCtrl.serviceInstances['d13aa0f2-4500-4e0d-aa14-1b9f4e0769d8'];

        expect(clusterSettingsCtrl.activeServiceInstance).toBe(null);
        clusterSettingsCtrl.disconnect(hcf4);
        expect(hcf4._busy).toBe(true);

        $httpBackend.when('POST', '/pp/v1/auth/logout/cnsi').respond(200,{});
        $httpBackend.expectPOST('/pp/v1/auth/logout/cnsi');

        $httpBackend.flush();
        expect(hcf4.account).not.toBeDefined();
        expect(hcf4.token_expiry).not.toBeDefined();
        expect(hcf4.valid).not.toBeDefined();
        expect(hcf4._busy).not.toBeDefined();
      });

      it('should handle failed disconnect', function () {
        var hcf4 = clusterSettingsCtrl.serviceInstances['d13aa0f2-4500-4e0d-aa14-1b9f4e0769d8'];

        expect(clusterSettingsCtrl.activeServiceInstance).toBe(null);
        clusterSettingsCtrl.disconnect(hcf4);
        expect(hcf4._busy).toBe(true);

        $httpBackend.when('POST', '/pp/v1/auth/logout/cnsi').respond(501,{});
        $httpBackend.expectPOST('/pp/v1/auth/logout/cnsi');

        $httpBackend.flush();
        expect(hcf4._busy).not.toBeDefined();
      });
    });
  });

})();
