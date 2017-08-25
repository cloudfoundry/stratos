(function () {
  'use strict';

  fdescribe('service-card directive', function () {
    var $compile, $httpBackend, $scope, mockBindingsApi, cfServiceInstanceService;
    var APP_GUID = '6e23689c-2844-4ebf-ab69-e52ab3439f6b';
    var cnsiGuid = 'cnsiGuid';
    var spaceGuid = 'spaceGuid';

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    function initController($injector, mockAuthModel, role) {
      console.log('Init'); // eslint-disable-line
      $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      cfServiceInstanceService = $injector.get('cfServiceInstanceService');
      var modelManager = $injector.get('modelManager');

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
          guid: APP_GUID,
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
          var markup = '<service-card app="app" cnsi-guid="guid" service="service">' +
            '</service-card>';
          element = angular.element(markup);
          $compile(element)($scope);

          $scope.$apply();
          $httpBackend.flush();

          serviceCardCtrl = element.controller('serviceCard');
        });

        it('will detach', function () {
          spyOn(cfServiceInstanceService, 'unbindServiceFromApp');
          serviceCardCtrl.detach({
            entity: {
              service_bindings: [{
                entity: {
                  app_guid: APP_GUID
                }
              }]
            }
          });
          expect(cfServiceInstanceService.unbindServiceFromApp)
            .toHaveBeenCalled();
        });
      });

    });
  });
})();
