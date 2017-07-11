(function () {
  'use strict';

  /* eslint-disable angular/no-private-call */
  describe('delete-app-workflow directive - ', function () {
    var $httpBackend, $scope, $q, appModel, serviceInstanceModel, cfServiceDeleteAppWorkflow;
    var appGuid = 'app_123';

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    beforeEach(inject(function ($injector) {
      // var $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      var modelManager = $injector.get('modelManager');
      appModel = modelManager.retrieve('cloud-foundry.model.application');
      serviceInstanceModel = modelManager.retrieve('cloud-foundry.model.service-instance');
      $q = $injector.get('$q');
      cfServiceDeleteAppWorkflow = $injector.get('cfServiceDeleteAppWorkflow');

    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should exist', function () {
      expect(cfServiceDeleteAppWorkflow).toBeDefined();
    });

    it('#unbindServiceInstances', function () {
      var bindingGuids = ['28aa8270-ab0e-480d-b9b6-ba4ec4f15015'];
      appModel.application.summary.guid = appGuid;
      var ListAllServiceBindingsForApp = mock.cloudFoundryAPI.Apps.ListAllServiceBindingsForApp(appGuid);
      var queryString = '?q=service_instance_guid+IN+28aa8270-ab0e-480d-b9b6-ba4ec4f15015&results-per-page=100';
      $httpBackend.whenGET(ListAllServiceBindingsForApp.url + queryString).respond(ListAllServiceBindingsForApp.response[200].body);
      $httpBackend.expectGET(ListAllServiceBindingsForApp.url + queryString);

      appModel.unbindServiceFromApp = function () { return $q.resolve(); };
      spyOn(appModel, 'unbindServiceFromApp').and.callThrough();

      cfServiceDeleteAppWorkflow.unbindServiceInstances('123', bindingGuids);
      $httpBackend.flush();

      expect(appModel.unbindServiceFromApp).toHaveBeenCalledTimes(1);
    });

    it('#deleteServiceInstances', function () {
      var safeServiceInstances = ['1', '2', '3'];
      spyOn(serviceInstanceModel, 'deleteServiceInstance').and.returnValue($q.resolve());

      cfServiceDeleteAppWorkflow.deleteServiceInstances('', safeServiceInstances);
      $scope.$apply();

      expect(serviceInstanceModel.deleteServiceInstance).toHaveBeenCalledTimes(safeServiceInstances.length);
    });

    it('#deleteServiceInstanceIfPossible - success', function () {
      serviceInstanceModel.deleteServiceInstance = function () { return $q.resolve(); };
      spyOn(serviceInstanceModel, 'deleteServiceInstance').and.callThrough();

      var p = cfServiceDeleteAppWorkflow.deleteServiceInstanceIfPossible('123');
      $scope.$apply();

      expect(serviceInstanceModel.deleteServiceInstance).toHaveBeenCalledTimes(1);
      expect(p.$$state.status).toBe(1);
    });

    it('#deleteServiceInstanceIfPossible - failure with error AssociationNotEmpty', function () {
      serviceInstanceModel.deleteServiceInstance = function () {
        return $q.reject({
          data: {
            error_code: 'CF-AssociationNotEmpty'
          }
        });
      };
      spyOn(serviceInstanceModel, 'deleteServiceInstance').and.callThrough();

      var p = cfServiceDeleteAppWorkflow.deleteServiceInstanceIfPossible(appGuid);
      $scope.$apply();

      expect(p.$$state.status).toBe(1);
    });

    it('#deleteServiceInstanceIfPossible - failure without error', function () {
      serviceInstanceModel.deleteServiceInstance = function () {
        return $q.reject({
          data: {
          }
        });
      };
      spyOn(serviceInstanceModel, 'deleteServiceInstance').and.callThrough();

      var p = cfServiceDeleteAppWorkflow.deleteServiceInstanceIfPossible(appGuid);
      $scope.$apply();

      expect(p.$$state.status).toBe(2);
    });

  });
  /* eslint-enable angular/no-private-call */
})();
