(function () {
  'use strict';

  describe('service-card directive', function () {
    var $compile, $httpBackend, $scope, mockBindingsApi, appEventService;

    var cnsiGuid = 'cnsiGuid';
    var spaceGuid = 'spaceGuid';

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    function initController($injector, mockAuthModel, role) {
      $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      var modelManager = $injector.get('modelManager');
      appEventService = $injector.get('appEventService');

      if (mockAuthModel) {
        var authModel = modelManager.retrieve('cloud-foundry.model.auth');
        spyOn(authModel, 'isAllowed').and.callFake(function () {
          // Everything is allowed in tests
          return true;
        });
      } else {
        var authModelOpts = {
          role: role,
          cnsiGuid: cnsiGuid,
          spaceGuid: spaceGuid
        };
        mock.cloudFoundryModel.Auth.initAuthModel($injector, authModelOpts);
      }
      // mocks
      $scope.guid = 'guid';
      $scope.cnsiGuid = cnsiGuid;
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
        entity: {label: 'Service'},
        metadata: {guid: '67229bc6-8fc9-4fe1-b8bc-8790cdae5334'}
      };

      mockBindingsApi = mock.cloudFoundryAPI.ServiceBindings;
      var ListAllServiceBindings = mockBindingsApi.ListAllServiceBindings();
      var params = '?include-relations=service_instance' +
        '&inline-relations-depth=1' +
        '&q=service_instance_guid+IN+01430cca-2592-4396-ac79-b1405a488b3e' +
        '&results-per-page=100';
      $httpBackend.whenGET(ListAllServiceBindings.url + params)
        .respond(200, ListAllServiceBindings.response['200'].body);
    }

    describe('with mocked authModel', function () {
      beforeEach(inject(function ($injector) {
        initController($injector, true);
      }));

      afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      });

      describe('with defaults', function () {
        var serviceCardCtrl, element;

        beforeEach(function () {
          var markup = '<service-catalogue-card app="app" cnsi-guid="guid" service="service">' +
            '</service-card>';
          element = angular.element(markup);
          $compile(element)($scope);

          $scope.$apply();
          $httpBackend.flush();

          serviceCardCtrl = element.controller('serviceCatalogueCard');
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
            spyOn(appEventService, '$emit');
            serviceCardCtrl.addService();
            expect(appEventService.$emit).toHaveBeenCalled();

            var args = appEventService.$emit.calls.mostRecent().args;
            expect(args[0]).toBe('cf.events.START_ADD_SERVICE_WORKFLOW');
          });
        });
      });
    });
    describe('with authModel for admin', function () {
      beforeEach(inject(function ($injector) {
        initController($injector, false, 'admin');
      }));

      afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      });

      describe('with defaults', function () {
        var serviceCardCtrl, element;

        beforeEach(function () {
          var markup = '<service-card app="app" cnsi-guid="cnsiGuid" service="service">' +
            '</service-card>';
          element = angular.element(markup);
          $compile(element)($scope);

          $scope.$apply();
          $httpBackend.flush();

          serviceCardCtrl = element.controller('serviceCard');
        });

        it('should display service actions', function () {
          expect(element).toBeDefined();
          expect(serviceCardCtrl).toBeDefined();
          expect(serviceCardCtrl.hideServiceActions()).toBe(false);
        });

      });
    });

    describe('with authModel for non admin user', function () {
      beforeEach(inject(function ($injector) {
        initController($injector, false, 'space_manager');
      }));

      afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      });

      describe('with defaults', function () {
        var serviceCardCtrl, element;

        beforeEach(function () {
          var markup = '<service-card app="app" cnsi-guid="cnsiGuid" service="service">' +
            '</service-card>';
          element = angular.element(markup);
          $compile(element)($scope);

          $scope.$apply();
          $httpBackend.flush();

          serviceCardCtrl = element.controller('serviceCard');
        });

        it('should disable service actions', function () {
          expect(element).toBeDefined();
          expect(serviceCardCtrl).toBeDefined();
          expect(serviceCardCtrl.hideServiceActions()).toBe(true);
        });

      });
    });
  });
})();
