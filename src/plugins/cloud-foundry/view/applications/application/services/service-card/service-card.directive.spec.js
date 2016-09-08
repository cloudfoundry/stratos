(function () {
  'use strict';

  describe('service-card directive', function () {
    var $compile, $httpBackend, $scope, mockBindingsApi;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();

      // mocks
      $scope.guid = 'guid';
      $scope.app = {
        summary: {
          guid: '6e23689c-2844-4ebf-ab69-e52ab3439f6b',
          services: [
            {
              guid: '01430cca-2592-4396-ac79-b1405a488b3e',
              service_plan: {
                guid: 'd22b3754-d093-42a2-a294-5fda6c6db44c',
                service: {
                  guid: '67229bc6-8fc9-4fe1-b8bc-8790cdae5334'
                }
              }
            }
          ]
        }
      };
      $scope.service = {
        entity: { label: 'Service' },
        metadata: { guid: '67229bc6-8fc9-4fe1-b8bc-8790cdae5334' }
      };

      mockBindingsApi = mock.cloudFoundryAPI.ServiceBindings;
      var ListAllServiceBindings = mockBindingsApi.ListAllServiceBindings();
      var params = '?include-relations=service_instance' +
        '&inline-relations-depth=1' +
        '&q=service_instance_guid+IN+01430cca-2592-4396-ac79-b1405a488b3e' +
        '&results-per-page=100';
      $httpBackend.whenGET(ListAllServiceBindings.url + params)
        .respond(200, ListAllServiceBindings.response['200'].body);
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('with defaults', function () {
      var serviceCardCtrl, element;

      beforeEach(function () {
        var markup = '<service-card app="app" cnsi-guid="guid" service="service">' +
          '</service-card>';
        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();
        $httpBackend.flush();

        serviceCardCtrl = element.controller('serviceCard');
      });

      it('should be defined and initialized', function () {
        expect(element).toBeDefined();
        expect(serviceCardCtrl).toBeDefined();

        expect(serviceCardCtrl.serviceBindings).not.toEqual([]);
        expect(serviceCardCtrl.numAttached).toBe(1);
        expect(serviceCardCtrl.actions.length).toBe(3);
      });

      describe('init', function () {
        beforeEach(function () {
          spyOn(serviceCardCtrl, 'getServiceInstanceGuids').and.callThrough();
          spyOn(serviceCardCtrl, 'getServiceBindings').and.callThrough();
          spyOn(serviceCardCtrl, 'updateActions').and.callThrough();
        });

        afterAll(function () {
          var service = {
            guid: '01430cca-2592-4396-ac79-b1405a488b3e',
            service_plan: {
              guid: 'd22b3754-d093-42a2-a294-5fda6c6db44c',
              service: {
                guid: '67229bc6-8fc9-4fe1-b8bc-8790cdae5334'
              }
            }
          };
          $scope.app.summary.services.push(service);
        });

        it('should set serviceBindings', function () {
          serviceCardCtrl.init().then(function () {
            expect(serviceCardCtrl.serviceBindings.length).toBe(1);
            expect(serviceCardCtrl.numAttached).toBe(1);
            expect(serviceCardCtrl.actions[1].hidden).toBeFalsy();
            expect(serviceCardCtrl.actions[2].hidden).toBeFalsy();
          });

          $httpBackend.flush();

          expect(serviceCardCtrl.getServiceInstanceGuids).toHaveBeenCalled();
          expect(serviceCardCtrl.getServiceBindings).toHaveBeenCalled();
        });

        it('should not set serviceBindings', function () {
          $scope.app.summary.services.length = 0;
          serviceCardCtrl.init();

          expect(serviceCardCtrl.serviceBindings.length).toBe(0);
          expect(serviceCardCtrl.numAttached).toBe(0);
          expect(serviceCardCtrl.actions[1].hidden).toBeTruthy();
          expect(serviceCardCtrl.actions[2].hidden).toBeTruthy();
          expect(serviceCardCtrl.getServiceInstanceGuids).toHaveBeenCalled();
          expect(serviceCardCtrl.getServiceBindings).not.toHaveBeenCalled();
          expect(serviceCardCtrl.updateActions).toHaveBeenCalled();
        });
      });

      describe('addService', function () {
        it('should emit cf.events.START_ADD_SERVICE_WORKFLOW event', function () {
          spyOn(serviceCardCtrl.eventService, '$emit');
          serviceCardCtrl.addService();
          expect(serviceCardCtrl.eventService.$emit).toHaveBeenCalled();

          var args = serviceCardCtrl.eventService.$emit.calls.mostRecent().args;
          expect(args[0]).toBe('cf.events.START_ADD_SERVICE_WORKFLOW');
        });
      });

      describe('detach', function () {
        it('should call unbindServiceFromApp', function () {
          spyOn(serviceCardCtrl.serviceInstanceService, 'unbindServiceFromApp');
          serviceCardCtrl.detach();
          expect(serviceCardCtrl.serviceInstanceService.unbindServiceFromApp)
            .toHaveBeenCalled();
          var args = serviceCardCtrl.serviceInstanceService.unbindServiceFromApp.calls.argsFor(0);
          expect(args[0]).toBe('guid');
          expect(args[1]).toBe('6e23689c-2844-4ebf-ab69-e52ab3439f6b');
          expect(args[2]).toBe('571b283b-97f9-41e3-abc7-81792ee34e40');
          expect(args[3]).toBe('instance_123');
        });

        it('should not call unbindServiceFromApp if no services attached', function () {
          spyOn(serviceCardCtrl.serviceInstanceService, 'unbindServiceFromApp');
          serviceCardCtrl.serviceBindings.length = 0;
          serviceCardCtrl.detach();
          expect(serviceCardCtrl.serviceInstanceService.unbindServiceFromApp)
            .not.toHaveBeenCalled();
        });
      });

      describe('manageInstances', function () {
        it('should emit cf.events.START_MANAGE_SERVICES event', function () {
          spyOn(serviceCardCtrl.eventService, '$emit');
          serviceCardCtrl.manageInstances();
          expect(serviceCardCtrl.eventService.$emit).toHaveBeenCalled();

          var args = serviceCardCtrl.eventService.$emit.calls.mostRecent().args;
          expect(args[0]).toBe('cf.events.START_MANAGE_SERVICES');
        });
      });
    });
  });

})();
