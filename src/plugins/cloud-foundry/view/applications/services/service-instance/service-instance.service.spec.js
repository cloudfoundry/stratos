(function () {
  'use strict';

  describe('service instance', function () {
    var $httpBackend, serviceInstance, confirmDialog;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      serviceInstance = $injector.get('cloud-foundry.view.applications.services.serviceInstanceService');
      confirmDialog = $injector.get('helion.framework.widgets.dialog.confirm');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(serviceInstance).toBeDefined();
    });

    it('unbindServiceFromApp', function () {
      it('should delete service binding and get app summary on confirm', function () {
        // delete service binding
        $httpBackend.when('DELETE', '/pp/v1/proxy/v2/service_bindings/binding_123').respond(200, {});
        // get app summary
        $httpBackend.when('GET', '/pp/v1/proxy/v2/apps/app_123/summary').respond(200, {});

        serviceInstance.unbindServiceFromApp('guid', 'app_123', 'binding_123', 'service_123');
        confirmDialog.confirmed();

        $httpBackend.flush();
      });
    });

    it('viewEnvVariables', function () {
      it('should get env variables for app', function () {
        // get app env variables
        $httpBackend.when('GET', '/pp/v1/proxy/v2/apps/app_123/env').respond(200, {});
        serviceInstance.viewEnvVariables('guid', {guid: 'app_123'});
        $httpBackend.flush();
      });
    });
  });
})();
