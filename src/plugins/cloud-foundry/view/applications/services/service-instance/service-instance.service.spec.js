(function () {
  'use strict';

  describe('service instance', function () {
    var $httpBackend, serviceInstance, $uibModal, $q;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      serviceInstance = $injector.get('cloud-foundry.view.applications.services.serviceInstanceService');
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(serviceInstance).toBeDefined();
    });

    describe('unbindServiceFromApp', function () {
      it('should delete service binding and get app summary on confirm', function () {
        // delete service binding
        $httpBackend.when('DELETE', '/pp/v1/proxy/v2/service_bindings/binding_123').respond(200, {});
        // get app summary
        $httpBackend.when('GET', '/pp/v1/proxy/v2/apps/app_123/summary').respond(200, {});

        spyOn($uibModal, 'open').and.callFake(function (config) {
          return {
            result:  config.resolve.confirmDialogContext().callback(),
            rendered: $q.resolve().promise
          };
        });

        serviceInstance.unbindServiceFromApp('guid', 'app_123', 'binding_123', 'service_123');
        $httpBackend.flush();
      });
    });

    describe('viewEnvVariables', function () {

      var appAutoscaler = {
        credentials: {
          agentUsername: 'agent',
          api_url: 'http://sclr-api-int.hcf.svc:28861/api',
          service_id: '3a7e7f9a-9cfb-4582-bf80-6fc50151debb',
          app_id: 'e793bedd-57f0-4ae1-b379-8cbf216b4e7d',
          url: 'http://sclr-server-int.hcf.svc:28862/server',
          agentPassword: '019d367b-e780-4a9e-b122-1314071e9205'
        },
        syslog_drain_url: null,
        volume_mounts: [],
        label: 'app-autoscaler',
        provider: null,
        plan: 'default',
        name: 'rc-auto-scaler',
        tags: []
      };

      it('should get env variables for app', function () {
        // get app env variables
        $httpBackend.when('GET', '/pp/v1/proxy/v2/apps/app_123/env').respond(200, {
          system_env_json: {
            VCAP_SERVICES: {
              'app-autoscaler': [ appAutoscaler ]
            }
          }
        });

        spyOn($uibModal, 'open').and.callFake(function (config) {
          expect(config.resolve.context().variables).toEqual(appAutoscaler);
          return {
            opened: $q.defer().promise,
            closed: $q.defer().promise,
            rendered: $q.defer().promise,
            result: $q.defer().promise
          };
        });

        serviceInstance.viewEnvVariables('guid', {guid: 'app_123'}, 'app-autoscaler', { name: 'rc-auto-scaler' });
        $httpBackend.flush();
      });
    });

    describe('deleteService', function () {

      it('should not delete on cancel', function () {
        var callback = function () {
          fail('callback should not have been called if confirmation cancelled');
        };

        spyOn($uibModal, 'open').and.callFake(function () {
          return $q.reject();
        });

        serviceInstance.deleteService('guid', 'serviceInstanceGuid', 'serviceInstanceName', callback).then(function () {
          fail('Should not resolve promise if confirmation cancelled');
        });
      });

      it('should not call callback when delete fails', function () {
        var callback = function () {
          fail('callback should not have been called if delete fails');
        };

        spyOn($uibModal, 'open').and.callFake(function (config) {
          return config.resolve.confirmDialogContext().callback();
        });

        $httpBackend.expect('DELETE', '/pp/v1/proxy/v2/service_instances/serviceInstanceGuid?async=false&recursive=true').respond(400, { });

        serviceInstance.deleteService('guid', 'serviceInstanceGuid', 'serviceInstanceName', callback)
          .then(function () {
            fail('Should not resolve promise if confirmation cancelled');
          });

        $httpBackend.flush();
      });

      it('successful delete', function () {
        var callback = jasmine.createSpy();

        spyOn($uibModal, 'open').and.callFake(function (config) {
          return config.resolve.confirmDialogContext().callback();
        });

        $httpBackend.expect('DELETE', '/pp/v1/proxy/v2/service_instances/serviceInstanceGuid?async=false&recursive=true').respond(200, { });

        serviceInstance.deleteService('guid', 'serviceInstanceGuid', 'serviceInstanceName', callback)
          .catch(function () {
            fail('Should not reject promise if everything succeeds');
          });

        $httpBackend.flush();

        expect(callback).toHaveBeenCalled();
      });
    });

    describe('unbindServiceFromApps', function () {

      var serviceBindings = [ {
        metadata: {
          guid: 'bindingGuid'
        },
        entity: {
          app: {
            metadata: {
              guid: 'appGuid'
            }
          }
        }
      }];
      var serviceInstanceName = 'serviceInstanceName';

      it('should not unbind on cancel', function () {
        var callback = function () {
          fail('callback should not have been called if confirmation cancelled');
        };

        spyOn($uibModal, 'open').and.callFake(function () {
          return $q.reject();
        });

        serviceInstance.unbindServiceFromApps('guid', serviceBindings, serviceInstanceName, callback).then(function () {
          fail('Should not resolve promise if confirmation cancelled');
        });
      });

      it('should not update if unbind failed', function () {
        spyOn($uibModal, 'open').and.callFake(function (config) {
          return config.resolve.confirmDialogContext().callback();
        });

        var mockDelete = mock.cloudFoundryAPI.ServiceBindings.DeleteServiceBinding(serviceBindings[0].metadata.guid);
        $httpBackend.expect('DELETE', mockDelete.url).respond(500, mockDelete.response[500].body);

        serviceInstance.unbindServiceFromApps('guid', serviceBindings, serviceInstanceName, _.noop);
        $httpBackend.flush();
      });

      it('successful unbind', function () {
        var callback = jasmine.createSpy();

        spyOn($uibModal, 'open').and.callFake(function (config) {
          return config.resolve.confirmDialogContext().callback();
        });

        var mockDelete = mock.cloudFoundryAPI.ServiceBindings.DeleteServiceBinding(serviceBindings[0].metadata.guid);
        $httpBackend.expect('DELETE', mockDelete.url).respond(200, mockDelete.response[200].body);

        var mockSummary = mock.cloudFoundryAPI.Apps.GetAppSummary(serviceBindings[0].entity.app.metadata.guid);
        $httpBackend.expect('GET', mockSummary.url).respond(200, mockSummary.response[200].body);

        serviceInstance.unbindServiceFromApps('guid', serviceBindings, serviceInstanceName, callback)
          .catch(function () {
            fail('Should not reject promise if everything succeeds');
          });

        $httpBackend.flush();

        expect(callback).toHaveBeenCalled();
      });
    });
  });
})();
