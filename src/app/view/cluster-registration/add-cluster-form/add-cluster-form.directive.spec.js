(function () {
  'use strict';

  describe('add-cluster-form directive', function () {
    var $httpBackend, $scope, element, addClusterFormCtrl, serviceInstanceModel;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var modelManager = $injector.get('app.model.modelManager');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      $scope.onCancel = angular.noop;
      $scope.onSubmit = angular.noop;

      var markup = '<add-cluster-form on-cancel="onCancel()" on-submit="onSubmit()">' +
                   '<add-cluster-form/>';

      element = angular.element(markup);
      $compile(element)($scope);

      $scope.$apply();

      addClusterFormCtrl = element.controller('addClusterForm');
      serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
      spyOn(addClusterFormCtrl, 'onCancel').and.callThrough();
      spyOn(addClusterFormCtrl, 'onSubmit').and.callThrough();
      spyOn(addClusterFormCtrl, 'clearForm').and.callThrough();
      spyOn(addClusterFormCtrl, 'onAddClusterError').and.callThrough();
    }));

    it('should be defined', function () {
      expect(element).toBeDefined();
    });

    it('should have `serviceInstanceModel` property defined', function () {
      var model = addClusterFormCtrl.serviceInstanceModel;
      expect(model).toBeDefined();
      expect(model.serviceInstances.length).toBe(0);
    });

    it('should have `url` and `name` properties initially set to null', function () {
      expect(addClusterFormCtrl.url).toBe(null);
      expect(addClusterFormCtrl.name).toBe(null);
    });

    it('should have `existingApiEndpoints` initially empty', function () {
      expect(addClusterFormCtrl.existingApiEndpoints).toEqual([]);
    });

    it('should have `onCancel` and `onSubmit` initially bound', function () {
      expect(addClusterFormCtrl.onCancel).toBeDefined();
      expect(addClusterFormCtrl.onSubmit).toBeDefined();
    });

    it('should have `addClusterError` initially set to false', function () {
      expect(addClusterFormCtrl.addClusterError).toBe(false);
    });

    it('should add cluster to serviceInstanceModel on addCluster()', function () {
      var mockResponse = {
        id: 1,
        url: 'url',
        name: 'name'
      };
      $httpBackend.when('POST', '/pp/v1/register/hcf').respond(200, mockResponse);

      addClusterFormCtrl.url = 'url';
      addClusterFormCtrl.name = 'name';
      addClusterFormCtrl.addCluster();
      $httpBackend.flush();

      expect(addClusterFormCtrl.serviceInstanceModel.serviceInstances.length).toBe(1);
      expect(addClusterFormCtrl.clearForm).toHaveBeenCalled();
      expect(addClusterFormCtrl.onSubmit).toHaveBeenCalled();
    });

    it('should not add cluster on error on addCluster()', function () {
      $httpBackend.when('POST', '/pp/v1/register/hcf').respond(500, {});

      addClusterFormCtrl.addCluster();
      $httpBackend.flush();

      expect(addClusterFormCtrl.serviceInstanceModel.serviceInstances.length).toBe(0);
      expect(addClusterFormCtrl.clearForm).not.toHaveBeenCalled();
      expect(addClusterFormCtrl.onSubmit).not.toHaveBeenCalled();
      expect(addClusterFormCtrl.onAddClusterError).toHaveBeenCalled();
    });

    it('should clear form and call onCancel() on cancel()', function () {
      addClusterFormCtrl.cancel();

      expect(addClusterFormCtrl.clearForm).toHaveBeenCalled();
      expect(addClusterFormCtrl.onCancel).toHaveBeenCalled();
    });

    it('should clear form on clearForm()', function () {
      addClusterFormCtrl.clearForm();

      expect(addClusterFormCtrl.url).toBe(null);
      expect(addClusterFormCtrl.name).toBe(null);
      expect(addClusterFormCtrl.addClusterError).toBe(false);
    });

    it('should set addClusterError onAddClusterError()', function () {
      addClusterFormCtrl.onAddClusterError();
      expect(addClusterFormCtrl.addClusterError).toBe(true);
    });
  });

})();
